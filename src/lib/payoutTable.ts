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
 * Masters Tournament payout percentages by finishing position (1-indexed).
 * Top 50 + ties make the cut; positions beyond 50 receive $0.
 * Percentages derived from the official 2026 Masters payout table ($22.5M purse).
 * Source: https://sports.yahoo.com/articles/masters-2026-heres-prize-money-150331392.html
 */
const MASTERS_PAYOUTS: number[] = [
  0.20000, // 1  — $4,500,000
  0.10800, // 2  — $2,430,000
  0.06800, // 3  — $1,530,000
  0.04800, // 4  — $1,080,000
  0.04000, // 5  — $900,000
  0.03600, // 6  — $810,000
  0.03350, // 7  — $753,750
  0.03100, // 8  — $697,500
  0.02900, // 9  — $652,500
  0.02700, // 10 — $607,500
  0.02500, // 11 — $562,500
  0.02300, // 12 — $517,500
  0.02100, // 13 — $472,500
  0.01900, // 14 — $427,500
  0.01800, // 15 — $405,000
  0.01700, // 16 — $382,500
  0.01600, // 17 — $360,000
  0.01500, // 18 — $337,500
  0.01400, // 19 — $315,000
  0.01300, // 20 — $292,500
  0.01200, // 21 — $270,000
  0.01120, // 22 — $252,000
  0.01040, // 23 — $234,000
  0.00960, // 24 — $216,000
  0.00880, // 25 — $198,000
  0.00800, // 26 — $180,000
  0.00766, // 27 — $172,250 (approx)
  0.00740, // 28 — $166,500
  0.00710, // 29 — $159,750
  0.00680, // 30 — $153,000
  0.00650, // 31 — $146,250
  0.00620, // 32 — $139,500
  0.00590, // 33 — $132,750
  0.00565, // 34 — $127,125 (approx)
  0.00540, // 35 — $121,500
  0.00515, // 36 — $115,875 (approx)
  0.00490, // 37 — $110,250
  0.00470, // 38 — $105,750
  0.00450, // 39 — $101,250
  0.00430, // 40 — $96,750
  0.00410, // 41 — $92,250
  0.00390, // 42 — $87,750
  0.00370, // 43 — $83,250
  0.00350, // 44 — $78,750
  0.00330, // 45 — $74,250
  0.00310, // 46 — $69,750
  0.00290, // 47 — $65,250
  0.00274, // 48 — $61,650 (approx)
  0.00260, // 49 — $58,500
  0.00252, // 50 — $56,700
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
  if (tournamentType === 'signature') return SIGNATURE_PAYOUTS
  if (tournamentType === 'major') return MASTERS_PAYOUTS
  return PAYOUTS
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
 * Returns the flat payout for a missed cut at a given tournament type.
 * The Masters (and other majors) pay all professionals who miss the cut a flat fee.
 */
export function getMissedCutPayout(tournamentType: string | null | undefined): number {
  if (tournamentType === 'major') return 25000
  return 0
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
  if (pos === null || pos < 1) {
    // Flat missed-cut payout for tournaments that pay non-qualifiers (e.g. Masters = $25k)
    if (positionStr) {
      const str = positionStr.trim().toUpperCase()
      if (str === 'MC' || str === 'CUT' || str === 'MDF') {
        return getMissedCutPayout(tournamentType)
      }
    }
    return 0
  }
  const table = getPayoutTable(tournamentType)
  const count = Math.max(1, tiedCount)
  let sum = 0
  for (let i = 0; i < count; i++) {
    const idx = pos - 1 + i
    if (idx < table.length) sum += table[idx]
  }
  return Math.round((sum / count) * purse)
}
