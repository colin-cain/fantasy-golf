/**
 * Standard PGA Tour payout percentages by finishing position (1-indexed).
 * Positions beyond index 64 (i.e. outside the top 65) receive $0.
 * Source: PGA Tour official payout structure for full-field events.
 */
const PAYOUTS: number[] = [
  0.18000, // 1
  0.10900, // 2
  0.06900, // 3
  0.04900, // 4
  0.04100, // 5
  0.03625, // 6
  0.03375, // 7
  0.03125, // 8
  0.02925, // 9
  0.02750, // 10
  0.02575, // 11
  0.02400, // 12
  0.02250, // 13
  0.02100, // 14
  0.02000, // 15
  0.01900, // 16
  0.01800, // 17
  0.01700, // 18
  0.01625, // 19
  0.01550, // 20
  0.01475, // 21
  0.01400, // 22
  0.01325, // 23
  0.01250, // 24
  0.01175, // 25
  0.01100, // 26
  0.01050, // 27
  0.01000, // 28
  0.00950, // 29
  0.00900, // 30
  0.00850, // 31
  0.00800, // 32
  0.00750, // 33
  0.00710, // 34
  0.00670, // 35
  0.00630, // 36
  0.00590, // 37
  0.00565, // 38
  0.00540, // 39
  0.00515, // 40
  0.00490, // 41
  0.00475, // 42
  0.00460, // 43
  0.00445, // 44
  0.00430, // 45
  0.00415, // 46
  0.00400, // 47
  0.00390, // 48
  0.00380, // 49
  0.00370, // 50
  0.00365, // 51
  0.00360, // 52
  0.00355, // 53
  0.00350, // 54
  0.00345, // 55
  0.00340, // 56
  0.00335, // 57
  0.00330, // 58
  0.00325, // 59
  0.00320, // 60
  0.00315, // 61
  0.00310, // 62
  0.00305, // 63
  0.00300, // 64
  0.00295, // 65
]

/**
 * Signature Event payout percentages by finishing position (1-indexed).
 * Signature Events have ~50-70 players (no cut), frontloaded payouts, and a $20M purse.
 * Positions beyond index 51 receive $0.
 * Derived from PGA Tour official data for the 2026 season (Arnold Palmer, Genesis).
 */
const SIGNATURE_PAYOUTS: number[] = [
  0.20000, // 1
  0.11000, // 2
  0.06000, // 3
  0.06000, // 4
  0.04200, // 5
  0.03800, // 6
  0.03365, // 7
  0.03365, // 8
  0.02890, // 9
  0.02890, // 10
  0.02570, // 11
  0.02360, // 12
  0.01980, // 13
  0.01980, // 14
  0.01980, // 15
  0.01695, // 16
  0.01695, // 17
  0.01495, // 18
  0.01495, // 19
  0.01298, // 20
  0.01298, // 21
  0.01123, // 22
  0.01123, // 23
  0.00891, // 24
  0.00891, // 25
  0.00891, // 26
  0.00891, // 27
  0.00700, // 28
  0.00700, // 29
  0.00700, // 30
  0.00700, // 31
  0.00700, // 32
  0.00595, // 33
  0.00545, // 34
  0.00545, // 35
  0.00545, // 36
  0.00495, // 37
  0.00450, // 38
  0.00450, // 39
  0.00450, // 40
  0.00390, // 41
  0.00390, // 42
  0.00390, // 43
  0.00350, // 44
  0.00320, // 45
  0.00320, // 46
  0.00290, // 47
  0.00280, // 48
  0.00270, // 49
  0.00258, // 50
  0.00258, // 51
]

/**
 * Converts a position string like "T4", "5", "MC", "CUT", "WD", "DQ"
 * to a numeric position (or null for non-paying positions).
 */
function parsePosition(pos: string | null | undefined): number | null {
  if (!pos) return null
  const str = pos.trim().toUpperCase()
  if (str === 'MC' || str === 'CUT' || str === 'WD' || str === 'DQ' || str === 'MDF') return null
  const num = parseInt(str.replace(/^T/, ''), 10)
  return isNaN(num) ? null : num
}

/**
 * Returns the correct payout table for the given tournament type.
 * Signature Events use a frontloaded table; everything else uses the standard table.
 */
export function getPayoutTable(tournamentType: string | null | undefined): number[] {
  return tournamentType === 'signature' ? SIGNATURE_PAYOUTS : PAYOUTS
}

/**
 * Returns the effective cut line for a tournament.
 * Signature events have no cut (field ~50-70, everyone gets paid).
 * The explicit cutLine from the DB takes precedence over type-based defaults.
 */
export function getEffectiveCutLine(
  tournamentType: string | null | undefined,
  cutLine: number | null | undefined
): number {
  if (tournamentType === 'signature') return Infinity
  if (cutLine != null && cutLine > 0) return cutLine
  return 65 // standard PGA Tour default
}

/**
 * Given a position string and tournament purse, returns the projected prize money.
 * Returns 0 for missed cuts, withdrawals, or positions outside the payout range.
 *
 * Note: For tied positions (e.g. T4), this uses the straight position payout rather
 * than averaging across tied spots — intentionally optimistic for projection purposes.
 */
export function getProjectedEarnings(
  positionStr: string | null | undefined,
  purse: number,
  tournamentType?: string | null,
  cutLine?: number | null
): number {
  if (!purse || purse <= 0) return 0
  const table = getPayoutTable(tournamentType)
  const pos = parsePosition(positionStr)
  if (pos === null || pos < 1 || pos > table.length) return 0
  if (pos > getEffectiveCutLine(tournamentType, cutLine)) return 0
  return Math.round(purse * table[pos - 1])
}

/**
 * Calculates final (official) earnings for a golfer, correctly averaging
 * prize money across tied positions.
 *
 * @param positionStr    - Position string, e.g. "T4", "5", "MC"
 * @param tiedCount      - Number of players sharing this position (1 if sole holder)
 * @param purse          - Tournament total purse in dollars
 * @param tournamentType - Tournament type ("signature", "major", or standard)
 */
export function getFinalEarnings(
  positionStr: string | null | undefined,
  tiedCount: number,
  purse: number,
  tournamentType?: string | null
): number {
  if (!purse || purse <= 0) return 0
  const pos = parsePosition(positionStr)
  if (pos === null || pos < 1) return 0
  const table = getPayoutTable(tournamentType)
  const count = Math.max(1, tiedCount)
  let sum = 0
  for (let i = 0; i < count; i++) {
    const idx = pos - 1 + i
    if (idx < table.length) sum += table[idx]
  }
  return Math.round((sum / count) * purse)
}
