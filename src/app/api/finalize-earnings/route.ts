import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getFinalEarnings } from '@/lib/payoutTable'

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY!
const CRON_SECRET   = process.env.CRON_SECRET!

type LeaderboardRow = { firstName: string; lastName: string; position: string }

/**
 * Builds position→count and golfer→position maps from a leaderboard row array.
 */
function buildPositionMaps(rows: LeaderboardRow[]) {
  const posCounts: Record<string, number> = {}
  const golferPos: Record<string, string> = {}
  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`
    const pos  = row.position
    golferPos[name] = pos
    if (pos) posCounts[pos] = (posCounts[pos] ?? 0) + 1
  }
  return { posCounts, golferPos }
}

export async function GET(req: NextRequest) {
  const authHeader  = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find completed tournaments that still have picks with earnings = 0
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, purse, api_tourn_id')
    .eq('status', 'completed')

  if (!tournaments?.length) {
    return NextResponse.json({ message: 'No completed tournaments found' })
  }

  const results = []

  for (const tournament of tournaments) {
    // Check if any picks still have earnings = 0
    const { data: unpaidPicks } = await supabase
      .from('picks')
      .select('id, golfer_name')
      .eq('tournament_id', tournament.id)
      .eq('earnings', 0)

    if (!unpaidPicks?.length) {
      results.push({ tournament: tournament.name, skipped: 'already finalized' })
      continue
    }

    if (!tournament.purse || tournament.purse === 0) {
      results.push({ tournament: tournament.name, skipped: 'no purse on record' })
      continue
    }

    // Try leaderboard_cache first (valid if the tournament just completed)
    const { data: cachedRows } = await supabase
      .from('leaderboard_cache')
      .select('golfer_name, position')
      .eq('tournament_id', tournament.id)

    let golferPos: Record<string, string> = {}
    let posCounts: Record<string, number> = {}

    if (cachedRows?.length) {
      for (const r of cachedRows) {
        golferPos[r.golfer_name] = r.position
        if (r.position) posCounts[r.position] = (posCounts[r.position] ?? 0) + 1
      }
    } else if (tournament.api_tourn_id) {
      // Cache is stale — re-fetch from API
      const res = await fetch(
        `https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournament.api_tourn_id}&year=2026`,
        { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
      )
      const lb = await res.json()
      if (!lb.leaderboardRows) {
        results.push({ tournament: tournament.name, skipped: 'API returned no leaderboard data' })
        continue
      }
      const maps = buildPositionMaps(lb.leaderboardRows as LeaderboardRow[])
      golferPos  = maps.golferPos
      posCounts  = maps.posCounts
    } else {
      results.push({ tournament: tournament.name, skipped: 'no cache and no api_tourn_id' })
      continue
    }

    let updated = 0
    for (const pick of unpaidPicks) {
      const pos      = golferPos[pick.golfer_name] ?? null
      const count    = pos ? (posCounts[pos] ?? 1) : 1
      const earnings = getFinalEarnings(pos, count, tournament.purse)
      await supabase.from('picks').update({ earnings }).eq('id', pick.id)
      updated++
    }

    results.push({ tournament: tournament.name, updated })
  }

  return NextResponse.json({ results })
}
