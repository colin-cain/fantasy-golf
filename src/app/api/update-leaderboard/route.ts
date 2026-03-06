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

  // Guard 2: all done today — skip if every picked golfer has thru="F" and was updated today.
  // The "updated today" check prevents a day-2 deadlock where yesterday's "F" values would
  // block the first refresh of a new round.
  const { data: picks } = await supabase
    .from('picks')
    .select('golfer_name')
    .eq('tournament_id', tournament.id)

  const pickedNames = (picks ?? []).map((p: { golfer_name: string }) => p.golfer_name)

  if (pickedNames.length > 0) {
    const { data: cached } = await supabase
      .from('leaderboard_cache')
      .select('golfer_name, thru, last_updated')
      .in('golfer_name', pickedNames)

    if (cached && cached.length === pickedNames.length) {
      const today = now.toISOString().slice(0, 10) // "YYYY-MM-DD"
      const allFinished   = cached.every((r: { thru: string }) => r.thru === 'F')
      const updatedToday  = cached.some((r: { last_updated: string }) => r.last_updated?.slice(0, 10) === today)

      if (allFinished && updatedToday) {
        return NextResponse.json({ message: 'All picked players have finished their round for today' })
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
    thru: string
    currentRound: unknown
  }) => ({
    golfer_name: `${row.firstName} ${row.lastName}`,
    position:    row.position,
    total:       row.total,
    thru:        row.thru,
    round:       parseMongo(row.currentRound),
    tournament_id: tournament.id,
    last_updated:  new Date().toISOString(),
  }))

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
