import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!
const CRON_SECRET  = process.env.CRON_SECRET!

function parseMongo(val: unknown): number | null {
  // Plain number
  if (typeof val === 'number') return val
  // MongoDB $numberInt / $numberLong
  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>
    if ('$numberInt'  in v) return parseInt(v.$numberInt  as string, 10)
    if ('$numberLong' in v) return parseInt(v.$numberLong as string, 10)
  }
  // Numeric string
  if (typeof val === 'string') {
    const n = parseInt(val, 10)
    return isNaN(n) ? null : n
  }
  return null
}

type DbTournament = {
  id: string
  name: string
  api_tourn_id: string | null
  purse: number | null
}

type ScheduleEntry = {
  tournId: string
  name: string
  purse?: unknown
  totalPurse?: unknown
  prizeMoney?: unknown
  [key: string]: unknown
}

/**
 * Scores a schedule entry against a DB tournament name using significant-word overlap.
 * Returns 0 if no meaningful words match.
 */
function scoreMatch(dbName: string, apiName: string): number {
  const words = dbName.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const target = apiName.toLowerCase()
  return words.filter(w => target.includes(w)).length
}

export async function GET(req: NextRequest) {
  // Auth: same ?secret= pattern as the cron endpoint
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the full 2026 schedule from RapidAPI (1 call for the whole season)
  const scheduleRes = await fetch(
    'https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year=2026',
    { headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' } }
  )

  if (!scheduleRes.ok) {
    return NextResponse.json({ error: `Schedule API error: ${scheduleRes.status}` }, { status: 502 })
  }

  const scheduleData = await scheduleRes.json()
  const apiTournaments: ScheduleEntry[] = scheduleData.schedule ?? []

  if (!apiTournaments.length) {
    return NextResponse.json({ error: 'Empty schedule returned from API' }, { status: 502 })
  }

  // Load all our tournaments from the DB
  const { data: dbTournaments, error: dbErr } = await supabase
    .from('tournaments')
    .select('id, name, api_tourn_id, purse')

  if (dbErr || !dbTournaments?.length) {
    return NextResponse.json({ error: 'Failed to load DB tournaments', detail: dbErr?.message }, { status: 500 })
  }

  const results: {
    tournament: string
    matched: string | null
    score: number
    api_tourn_id: string | null
    purse: number | null
    updated: boolean
    skipped_reason?: string
  }[] = []

  for (const dbT of dbTournaments as DbTournament[]) {
    // Score every schedule entry against this tournament
    const scored = apiTournaments
      .map(t => ({ ...t, score: scoreMatch(dbT.name, t.name) }))
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)

    const best = scored[0]

    if (!best || best.score < 2) {
      results.push({
        tournament: dbT.name,
        matched: null,
        score: 0,
        api_tourn_id: null,
        purse: null,
        updated: false,
        skipped_reason: 'No confident match (score < 2)',
      })
      continue
    }

    // Extract purse — try common field names, handle MongoDB extended JSON
    const rawPurse = best.purse ?? best.totalPurse ?? best.prizeMoney ?? null
    const purse = parseMongo(rawPurse)

    // Determine what needs updating
    const needsId    = !dbT.api_tourn_id
    const needsPurse = (!dbT.purse || dbT.purse === 0) && purse !== null && purse > 0

    if (!needsId && !needsPurse) {
      results.push({
        tournament: dbT.name,
        matched: best.name,
        score: best.score,
        api_tourn_id: dbT.api_tourn_id,
        purse: dbT.purse ?? null,
        updated: false,
        skipped_reason: 'Already up to date',
      })
      continue
    }

    // Build update payload with only the fields that need changing
    const updatePayload: Record<string, unknown> = {}
    if (needsId)    updatePayload.api_tourn_id = best.tournId
    if (needsPurse) updatePayload.purse        = purse

    const { error: updateErr } = await supabase
      .from('tournaments')
      .update(updatePayload)
      .eq('id', dbT.id)

    results.push({
      tournament:  dbT.name,
      matched:     best.name,
      score:       best.score,
      api_tourn_id: needsId    ? best.tournId : (dbT.api_tourn_id ?? null),
      purse:        needsPurse ? purse        : (dbT.purse ?? null),
      updated:     !updateErr,
      skipped_reason: updateErr ? `DB update failed: ${updateErr.message}` : undefined,
    })
  }

  const updated   = results.filter(r => r.updated).length
  const unmatched = results.filter(r => !r.matched).length
  const skipped   = results.filter(r => r.matched && !r.updated).length

  return NextResponse.json({
    summary: {
      api_tournaments_in_schedule: apiTournaments.length,
      db_tournaments_checked:      dbTournaments.length,
      updated,
      skipped_already_current:     skipped,
      unmatched,
    },
    results,
  })
}
