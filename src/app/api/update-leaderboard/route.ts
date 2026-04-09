import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const CRON_SECRET  = process.env.CRON_SECRET!

function parseMongo(val: unknown): number | string {
  if (val && typeof val === 'object' && '$numberInt' in (val as object)) {
    return parseInt((val as { $numberInt: string }).$numberInt, 10)
  }
  return val as string
}

// Extracts a Unix ms timestamp from MongoDB { $date: { $numberLong: "..." } } format
function parseMongoDateMs(val: unknown): number | null {
  if (val && typeof val === 'object') {
    const d = (val as Record<string, unknown>)['$date']
    if (d && typeof d === 'object') {
      const nl = (d as Record<string, unknown>)['$numberLong']
      if (nl !== undefined) return parseInt(String(nl), 10)
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  // Accept either Vercel's Authorization: Bearer header (cron) or ?secret= query param (manual)
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the in-progress tournament in our DB.
  // If none found, check for an upcoming tournament whose tee_time has passed
  // and auto-promote it to in_progress so we never need a manual flip.
  let { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, tee_time, api_tourn_id, purse, round_status')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  if (!tournament) {
    const { data: upcoming } = await supabase
      .from('tournaments')
      .select('id, name, tee_time, api_tourn_id, purse, round_status')
      .eq('status', 'upcoming')
      .lte('tee_time', new Date().toISOString())
      .order('tee_time', { ascending: true })
      .limit(1)
      .single()

    if (upcoming) {
      await supabaseAdmin
        .from('tournaments')
        .update({ status: 'in_progress' })
        .eq('id', upcoming.id)
      tournament = upcoming
    }
  }

  if (!tournament) {
    return NextResponse.json({ message: 'No tournament in progress' })
  }

  const now = new Date()

  // Load picks + cache upfront — used by both guards below
  const { data: picks } = await supabase
    .from('picks')
    .select('golfer_name')
    .eq('tournament_id', tournament.id)

  const pickedNames = (picks ?? []).map((p: { golfer_name: string }) => p.golfer_name)

  type CacheRow = { golfer_name: string; thru: string; last_updated: string; round: unknown; tee_time: string | null }
  let cached: CacheRow[] = []
  if (pickedNames.length > 0) {
    const { data } = await supabase
      .from('leaderboard_cache')
      .select('golfer_name, thru, last_updated, round, tee_time')
      .in('golfer_name', pickedNames)
      .eq('tournament_id', tournament.id)
    cached = (data ?? []) as CacheRow[]
  }

  // Guard 1: too early — skip if none of our picks have teed off yet.
  // Uses each pick's individual tee time timestamp from cache (precise, per-player).
  // Only blocks when ALL cached tee times are still in the future — lifts the moment
  // any pick starts. Falls back to tournament.tee_time + 30 min when cache is empty
  // (i.e. the very first call for this tournament before any data exists).
  //
  // BYPASS: if any pick already has a non-empty thru value, play has started (or the
  // round is suspended mid-round). Skip this guard entirely — the API may be returning
  // tomorrow's resumption tee times for suspended rounds, which would otherwise block
  // all subsequent cron updates until the round resumes.
  {
    const anyStarted = cached.some((r) => r.thru && r.thru !== '0')

    if (!anyStarted) {
      const teeTimes = cached
        .map((r) => { const n = parseInt(String(r.tee_time ?? '')); return isNaN(n) ? null : n })
        .filter((n): n is number => n !== null)

      if (teeTimes.length > 0) {
        if (teeTimes.every((n) => n > now.getTime())) {
          // Every pick is still to tee off — wait until 30 min after the first one starts
          const firstCallAt = new Date(Math.min(...teeTimes) + 30 * 60 * 1000)
          if (now < firstCallAt) {
            return NextResponse.json({ message: 'Too early — no picks have teed off yet', firstCallAt })
          }
        }
      } else if (tournament.tee_time) {
        // No cached tee times yet (first call ever) — fall back to scheduled tournament tee time
        const firstCallAt = new Date(new Date(tournament.tee_time).getTime() + 30 * 60 * 1000)
        if (now < firstCallAt) {
          return NextResponse.json({ message: 'Too early — first call is 30 min after tee time', firstCallAt })
        }
      }
    }
  }

  // Guard 2: all done today — skip if every picked golfer has thru="F", was updated today,
  // AND the cached round matches the expected round for today. The round check prevents a
  // day-2 deadlock: if the API still returns round-N "F" data at the very start of round N+1,
  // the first cron call would stamp last_updated=today and block all subsequent calls.
  if (cached.length > 0 && cached.length === pickedNames.length) {
    const today = now.toISOString().slice(0, 10) // "YYYY-MM-DD"
    const allFinished  = cached.every((r) => r.thru === 'F')
    const updatedToday = cached.some((r) => r.last_updated?.slice(0, 10) === today)

    const msPerDay = 24 * 60 * 60 * 1000

    if (allFinished && updatedToday) {
      const rawRound = cached[0]?.round
      const cachedRound = typeof rawRound === 'number' ? rawRound : parseInt(String(rawRound ?? '0'), 10)
      const daysSinceTeeTime = tournament.tee_time
        ? Math.floor((now.getTime() - new Date(tournament.tee_time).getTime()) / msPerDay)
        : 0
      const expectedRound = Math.max(1, daysSinceTeeTime + 1)

      // On round 4 (the final round), always allow one more pass-through so the
      // API can return "Official" status and we can mark the tournament complete.
      if (cachedRound >= expectedRound && cachedRound < 4) {
        return NextResponse.json({ message: 'All picked players have finished their round for today' })
      }
    }

    // Between rounds: all finished but not yet updated today — we're in the overnight
    // gap before the next round starts. Block until the estimated next round tee time
    // (same time-of-day as the original tee time) to avoid burning API quota overnight.
    if (allFinished && !updatedToday && tournament.tee_time) {
      const daysSinceTeeTime = Math.floor((now.getTime() - new Date(tournament.tee_time).getTime()) / msPerDay)
      const nextRoundEstimate = new Date(new Date(tournament.tee_time).getTime() + (daysSinceTeeTime + 1) * msPerDay)
      if (now < nextRoundEstimate) {
        return NextResponse.json({ message: 'Between rounds — waiting for next round to start', nextRoundEstimate })
      }
    }

    // Guard 3: pending-official throttle — round 4 is complete but earnings not yet
    // confirmed. Guard 2a doesn't block round 4 (by design), and once updatedToday=true
    // guard 2b doesn't fire, so without this we'd poll every 30 min indefinitely.
    // Rate-limit to once every 2 hours when stuck in this state.
    if (allFinished) {
      const rawRound = cached[0]?.round
      const cachedRound = typeof rawRound === 'number' ? rawRound : parseInt(String(rawRound ?? '0'), 10)
      if (cachedRound >= 4) {
        const mostRecent = cached.reduce<string | null>((latest, r) => {
          if (!r.last_updated) return latest
          if (!latest || r.last_updated > latest) return r.last_updated
          return latest
        }, null)
        if (mostRecent) {
          const msSinceUpdate = now.getTime() - new Date(mostRecent).getTime()
          const twoHours = 2 * 60 * 60 * 1000
          if (msSinceUpdate < twoHours) {
            return NextResponse.json({ message: 'Round 4 complete — throttling until earnings confirmed', nextCheckAt: new Date(new Date(mostRecent).getTime() + twoHours) })
          }
        }
      }
    }
  }

  // Resolve the API tournId — use the cached value if we have it, otherwise fetch
  // the schedule once and save it so every subsequent cron call skips this API hit.
  let tournId = tournament.api_tourn_id as string | null
  let apiMatchedName: string | null = null

  if (!tournId) {
    const scheduleRes = await fetch(
      'https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year=2026',
      { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
    )
    const scheduleData = await scheduleRes.json()

    // Score entries by significant-word overlap to find the best match.
    // Threshold is adaptive: names with only 1 significant word (e.g. "RBC Heritage")
    // need score ≥ 1; names with 2+ words need score ≥ 2.
    // Exception: generic words like "open" / "championship" alone are too ambiguous
    // to match on — keep threshold at 2 for those to avoid false positives.
    const TOO_COMMON = new Set(['open', 'championship'])
    const ourName  = tournament.name.toLowerCase()
    const ourWords = ourName.split(' ').filter((w: string) => w.length > 3)
    const minScore = (ourWords.length === 1 && TOO_COMMON.has(ourWords[0]))
      ? 2
      : Math.min(2, ourWords.length)

    type ScheduleEntry = { name: string; tournId: string }
    const scored = (scheduleData.schedule as ScheduleEntry[] ?? [])
      .map(t => {
        const apiName = t.name.toLowerCase()
        const score = ourWords.filter((w: string) => apiName.includes(w)).length
        return { ...t, score }
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)

    const match = scored[0]

    if (!match || match.score < minScore) {
      return NextResponse.json({
        error: `No confident API match for: ${tournament.name}`,
        candidates: scored.slice(0, 3),
      }, { status: 404 })
    }

    tournId = match.tournId
    apiMatchedName = match.name

    // Persist so future cron calls skip the schedule fetch entirely
    await supabase
      .from('tournaments')
      .update({ api_tourn_id: tournId })
      .eq('id', tournament.id)
  }

  // Fetch the live leaderboard
  const lbRes = await fetch(
    `https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournId}&year=2026`,
    { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
  )
  const lb = await lbRes.json()

  if (!lb.leaderboardRows) {
    return NextResponse.json({ error: 'No leaderboard data from API' }, { status: 502 })
  }

  // Cache the tournament purse if we don't have it yet.
  // The API typically returns purse as a MongoDB $numberInt or plain number.
  const rawPurseVal = parseMongo(lb.purse ?? lb.totalPurse ?? lb.prizeMoney)
  const freshPurse = typeof rawPurseVal === 'number' && rawPurseVal > 0 ? rawPurseVal : 0
  if (!tournament.purse || tournament.purse === 0) {
    if (freshPurse > 0) {
      await supabase
        .from('tournaments')
        .update({ purse: freshPurse })
        .eq('id', tournament.id)
    }
  }
  const effectivePurse = (tournament.purse && tournament.purse > 0) ? tournament.purse : freshPurse

  // Always persist the current round status (e.g. "In Progress", "Suspended", "Official")
  // so the frontend can show appropriate indicators without hitting the API directly.
  // When the final round goes "Official", also mark the tournament as complete so the
  // frontend stops showing it as in-progress and the cron stops polling it.
  const roundStatus: string | null = typeof lb.roundStatus === 'string' ? lb.roundStatus : null
  const currentRound = parseMongo(lb.roundId)

  // Upsert every golfer row into leaderboard_cache
  const rows = lb.leaderboardRows.map((row: {
    firstName: string
    lastName: string
    position: string
    total: string
    currentRoundScore?: string
    thru: string
    currentRound: unknown
    teeTime?: string
    teeTimeTimestamp?: unknown
  }) => {
    // Prefer the ms timestamp (timezone-agnostic) so the client can localise it;
    // fall back to the raw time string (e.g. "11:55am") if not present.
    const tsMs = parseMongoDateMs(row.teeTimeTimestamp)
    return {
      golfer_name:  `${row.firstName} ${row.lastName}`,
      position:     row.position,
      total:        row.total,
      round_score:  row.currentRoundScore ?? null,
      thru:         row.thru,
      round:        parseMongo(row.currentRound),
      tee_time:     tsMs !== null ? String(tsMs) : (row.teeTime ?? null),
      tournament_id: tournament.id,
      last_updated:  new Date().toISOString(),
    }
  })

  const { error: upsertErr } = await supabaseAdmin
    .from('leaderboard_cache')
    .upsert(rows, { onConflict: 'golfer_name' })

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // When the tournament is officially complete, finalize earnings on all picks
  // using the dedicated earnings API endpoint (official PGA Tour amounts).
  // We join on playerId between the leaderboard and earnings endpoints to handle
  // name format inconsistencies (e.g. Korean golfers with compound given names).
  let earningsFinalized = 0
  if (roundStatus === 'Official' && tournId) {
    try {
      const earningsRes = await fetch(
        `https://live-golf-data.p.rapidapi.com/earnings?tournId=${tournId}&year=2026`,
        { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
      )
      const earningsData = await earningsRes.json()

      if (earningsData.leaderboard) {
        // playerId → canonical full name (from the leaderboard we already fetched)
        const pidToName: Record<string, string> = {}
        for (const row of lb.leaderboardRows as { playerId: string; firstName: string; lastName: string }[]) {
          pidToName[row.playerId] = `${row.firstName} ${row.lastName}`
        }

        // normalized name → earnings
        const nameToEarnings: Record<string, number> = {}
        for (const row of earningsData.leaderboard as { playerId: string; earnings: unknown }[]) {
          const name = pidToName[row.playerId]
          if (name) {
            const e = row.earnings
            const amt = (e && typeof e === 'object' && '$numberInt' in (e as object))
              ? parseInt((e as { $numberInt: string }).$numberInt, 10)
              : parseInt(String(e ?? '0'), 10)
            const normalized = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
            nameToEarnings[normalized] = amt
          }
        }

        const { data: tPicks } = await supabase
          .from('picks')
          .select('id, golfer_name')
          .eq('tournament_id', tournament.id)

        if (tPicks?.length) {
          for (const pick of tPicks) {
            const key      = pick.golfer_name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
            const earnings = nameToEarnings[key] ?? 0
            await supabaseAdmin.from('picks').update({ earnings }).eq('id', pick.id)
          }
          earningsFinalized = tPicks.length
        }
      }
    } catch (err) {
      console.error('[update-leaderboard] earnings fetch failed:', err)
    }
  }

  // Persist round status. Only mark completed once earnings are confirmed —
  // if the earnings API isn't ready yet the cron will keep retrying next run.
  const tournamentUpdate: Record<string, unknown> = { round_status: roundStatus }
  if (roundStatus === 'Official' && currentRound === 4 && earningsFinalized > 0) {
    tournamentUpdate.status = 'completed'
  }
  await supabaseAdmin
    .from('tournaments')
    .update(tournamentUpdate)
    .eq('id', tournament.id)

  return NextResponse.json({
    success: true,
    tournament: tournament.name,
    apiTournId: tournId,
    apiMatchedName: apiMatchedName ?? '(cached)',
    golfersUpdated: rows.length,
    round: parseMongo(lb.roundId),
    roundStatus: lb.roundStatus,
    earningsFinalized,
  })
}
