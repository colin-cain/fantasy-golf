import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

  // Find the in-progress tournament in our DB
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('id, name, tee_time')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  if (tErr || !tournament) {
    return NextResponse.json({ message: 'No tournament in progress' })
  }

  const now = new Date()

  // Guard 1: too early — skip until 30 min after the tournament's scheduled tee time
  if (tournament.tee_time) {
    const firstCallAt = new Date(new Date(tournament.tee_time).getTime() + 30 * 60 * 1000)
    if (now < firstCallAt) {
      return NextResponse.json({ message: 'Too early — first call is 30 min after tee time', firstCallAt })
    }
  }

  // Guard 2: all done today — skip if every picked golfer has thru="F", was updated today,
  // AND the cached round matches the expected round for today. The round check prevents a
  // day-2 deadlock: if the API still returns round-N "F" data at the very start of round N+1,
  // the first cron call would stamp last_updated=today and block all subsequent calls.
  const { data: picks } = await supabase
    .from('picks')
    .select('golfer_name')
    .eq('tournament_id', tournament.id)

  const pickedNames = (picks ?? []).map((p: { golfer_name: string }) => p.golfer_name)

  if (pickedNames.length > 0) {
    const { data: cached } = await supabase
      .from('leaderboard_cache')
      .select('golfer_name, thru, last_updated, round')
      .in('golfer_name', pickedNames)

    if (cached && cached.length === pickedNames.length) {
      const today = now.toISOString().slice(0, 10) // "YYYY-MM-DD"
      const allFinished   = cached.every((r: { thru: string }) => r.thru === 'F')
      const updatedToday  = cached.some((r: { last_updated: string }) => r.last_updated?.slice(0, 10) === today)

      if (allFinished && updatedToday) {
        // Extra guard: only skip if the round stored in the cache matches the expected round
        // for today. Without this, the first cron call of a new round day can write stale
        // "F" data from the previous round (API hasn't flipped yet), stamping last_updated
        // with today's date and blocking every subsequent call for the rest of the day.
        const rawRound = (cached[0] as { round?: unknown })?.round
        const cachedRound = typeof rawRound === 'number' ? rawRound : parseInt(String(rawRound ?? '0'), 10)
        const msPerDay = 24 * 60 * 60 * 1000
        const daysSinceTeeTime = tournament.tee_time
          ? Math.floor((now.getTime() - new Date(tournament.tee_time).getTime()) / msPerDay)
          : 0
        const expectedRound = Math.max(1, daysSinceTeeTime + 1)

        if (cachedRound >= expectedRound) {
          return NextResponse.json({ message: 'All picked players have finished their round for today' })
        }
      }
    }
  }

  // Fetch Slash Golf schedule to find the matching tournId
  const scheduleRes = await fetch(
    'https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year=2026',
    { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
  )
  const scheduleData = await scheduleRes.json()

  // Score every schedule entry by how many significant words (length > 3) it shares
  // with our tournament name, then pick the best match. This avoids false positives
  // from common words like "invitational" that appear in many tournament names.
  const ourName = tournament.name.toLowerCase()
  const ourWords = ourName.split(' ').filter((w: string) => w.length > 3)

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

  if (!match || match.score < 2) {
    return NextResponse.json({
      error: `No confident API match for: ${tournament.name}`,
      candidates: scored.slice(0, 3),
    }, { status: 404 })
  }

  // Fetch the live leaderboard
  const lbRes = await fetch(
    `https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${match.tournId}&year=2026`,
    { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
  )
  const lb = await lbRes.json()

  if (!lb.leaderboardRows) {
    return NextResponse.json({ error: 'No leaderboard data from API' }, { status: 502 })
  }

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

  const { error: upsertErr } = await supabase
    .from('leaderboard_cache')
    .upsert(rows, { onConflict: 'golfer_name' })

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    tournament: tournament.name,
    apiMatchedName: match.name,
    apiTournId: match.tournId,
    matchScore: match.score,
    golfersUpdated: rows.length,
    round: parseMongo(lb.roundId),
    roundStatus: lb.roundStatus,
  })
}
