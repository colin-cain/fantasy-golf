/**
 * Standard PGA Tour payout percentages by finishing position (1-indexed).
 * Positions beyond index 64 (i.e. outside the top 65) receive $0.
 * Source: PGA Tour official payout structure for full-field events.
 * Majors and Signature events use the same percentages but with a larger purse.
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
 * Given a position string and tournament purse, returns the projected prize money.
 * Returns 0 for missed cuts, withdrawals, or positions outside the payout range.
 *
 * Note: For tied positions (e.g. T4), this uses the straight position payout rather
 * than averaging across tied spots — intentionally optimistic for projection purposes.
 */
export function getProjectedEarnings(positionStr: string | null | undefined, purse: number): number {
  if (!purse || purse <= 0) return 0
  const pos = parsePosition(positionStr)
  if (pos === null || pos < 1 || pos > PAYOUTS.length) return 0
  return Math.round(purse * PAYOUTS[pos - 1])
}

/**
 * Calculates final (official) earnings for a golfer, correctly averaging
 * prize money across tied positions.
 *
 * @param positionStr - Position string, e.g. "T4", "5", "MC"
 * @param tiedCount   - Number of players sharing this position (1 if sole holder)
 * @param purse       - Tournament total purse in dollars
 */
export function getFinalEarnings(
  positionStr: string | null | undefined,
  tiedCount: number,
  purse: number
): number {
  if (!purse || purse <= 0) return 0
  const pos = parsePosition(positionStr)
  if (pos === null || pos < 1) return 0
  const count = Math.max(1, tiedCount)
  let sum = 0
  for (let i = 0; i < count; i++) {
    const idx = pos - 1 + i
    if (idx < PAYOUTS.length) sum += PAYOUTS[idx]
  }
  return Math.round((sum / count) * purse)
}
