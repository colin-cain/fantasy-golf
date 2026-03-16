export default function RulesPage() {
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">

        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rules</h1>
          <p className="text-slate-500 text-sm mt-1">2026 FGL — Stop Crying Schrette</p>
        </div>

        <div className="flex flex-col gap-4">

          {/* Rule 1 */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Picks</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>Draft one player each week off a rotating schedule.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>No player can be used more than once per team across the season.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>No player can be picked twice in the same week.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>Picks are submitted to the text group.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span><span>If a pick hasn&apos;t been submitted by 7 PM MT the day before the round, remaining members may jump in and pick first.</span></li>
            </ul>
          </div>

          {/* Rule 2 */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Buy-In & Payouts</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span><span><span className="font-medium text-slate-800">$100 buy-in</span> per member.</span></li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span><span><span className="font-medium text-slate-800">$25 weekly prize</span> for each Major, The Players, and the FedEx St. Jude — awarded to the member whose pick performs best that week.</span></li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span><span>If two members tie for a weekly prize, the tiebreaker is performance at the following major. For example, if Ben and Ty tie at Augusta and the PGA draft order is JJ → Ben → Ty, then Ben wins the Masters prize and JJ wins the PGA prize.</span></li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>
                <span>Remainder of the pot is paid out at season&apos;s end:
                  <span className="inline-flex flex-wrap gap-2 mt-2 ml-0">
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">🥇 1st — $250</span>
                    <span className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">🥈 2nd — $125</span>
                    <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">🥉 3rd — $75</span>
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Rule 3 */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Winning</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Season standings are determined purely by <span className="font-medium text-slate-800">total PGA Tour earnings</span> accumulated by each member&apos;s picks across the season.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">4</span>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Mid-Tournament Sub</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>Each member gets <span className="font-medium text-slate-800">one sub per season</span>.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>A sub can be made after the cut and before Round 3 begins.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>The replacement player must be <span className="font-medium text-slate-800">outside the top 20</span> at the time of the sub.</li>
              <li className="flex gap-2"><span className="text-slate-300 mt-0.5">—</span>Both the original pick and the sub are marked as <span className="font-medium text-slate-800">used</span> and cannot be selected again.</li>
            </ul>
          </div>

        </div>
      </div>
    </main>
  )
}
