import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const CRON_SECRET  = process.env.CRON_SECRET!

const RAPIDAPI_HEADERS = {
  'x-rapidapi-key':  RAPIDAPI_KEY,
  'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
}

/**
 * Strips diacritics so names like "Højgaard" match picks stored as "Hojgaard".
 */
function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/**
 * Parses a MongoDB { $numberInt: "..." } value or a plain number/string.
 */
function parseMongoInt(val: unknown): number {
  if (val && typeof val === 'object' && '$numberInt' in (val as object)) {
    return parseInt((val as { $numberInt: string }).$numberInt, 10)
  }
  return parseInt(String(val ?? '0'), 10)
}

/**
 * Fetches official per-player earnings from the RapidAPI earnings endpoint,
 * cross-referenced with the leaderboard endpoint for reliable playerId→name mapping.
 *
 * The leaderboard and earnings endpoints use different name formats for some
 * players (e.g. Korean golfers), so we join on playerId rather than name.
 *
 * Returns a map of normalized golfer name → earnings in dollars.
 */
async function fetchOfficialEarnings(tournId: string): Promise<Record<string, number> | null> {
  const [lbRes, earningsRes] = await Promise.all([
    fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournId}&year=2026`, { headers: RAPIDAPI_HEADERS }),
    fetch(`https://live-golf-data.p.rapidapi.com/earnings?tournId=${tournId}&year=2026`,            { headers: RAPIDAPI_HEADERS }),
  ])

  const [lb, earningsData] = await Promise.all([lbRes.json(), earningsRes.json()])

  if (!lb.leaderboardRows || !earningsData.leaderboard) return null

  // Build playerId → canonical full name from leaderboard (correct full names)
  const pidToName: Record<string, string> = {}
  for (const row of lb.leaderboardRows as { playerId: string; firstName: string; lastName: string }[]) {
    pidToName[row.playerId] = `${row.firstName} ${row.lastName}`
  }

  // Build normalized name → earnings via playerId cross-reference
  const nameToEarnings: Record<string, number> = {}
  for (const row of earningsData.leaderboard as { playerId: string; earnings: unknown }[]) {
    const name = pidToName[row.playerId]
    if (name) {
      nameToEarnings[normalizeName(name)] = parseMongoInt(row.earnings)
    }
  }

  return nameToEarnings
}

export async function GET(req: NextRequest) {
  const authHeader  = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, api_tourn_id')
    .eq('status', 'completed')

  if (!tournaments?.length) {
    return NextResponse.json({ message: 'No completed tournaments found' })
  }

  const results = []

  for (const tournament of tournaments) {
    const { data: unpaidPicks } = await supabase
      .from('picks')
      .select('id, golfer_name')
      .eq('tournament_id', tournament.id)
      .eq('earnings', 0)

    if (!unpaidPicks?.length) {
      results.push({ tournament: tournament.name, skipped: 'already finalized' })
      continue
    }

    if (!tournament.api_tourn_id) {
      results.push({ tournament: tournament.name, skipped: 'no api_tourn_id' })
      continue
    }

    const nameToEarnings = await fetchOfficialEarnings(tournament.api_tourn_id)

    if (!nameToEarnings) {
      results.push({ tournament: tournament.name, skipped: 'API returned no data' })
      continue
    }

    let updated = 0
    for (const pick of unpaidPicks) {
      const earnings = nameToEarnings[normalizeName(pick.golfer_name)] ?? 0
      await supabaseAdmin.from('picks').update({ earnings }).eq('id', pick.id)
      updated++
    }

    results.push({ tournament: tournament.name, updated })
  }

  return NextResponse.json({ results })
}
