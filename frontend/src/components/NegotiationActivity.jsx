import { ArrowDownRight, ArrowUpRight, MessageSquareText, Sparkles } from 'lucide-react'

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

const formatPercent = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'percent',
  maximumFractionDigits: 2,
  signDisplay: 'always',
}).format(amount)

function NegotiationActivity({ entries, originalQuote }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-labelledby="activity-heading">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-slate-400">
          <MessageSquareText size={16} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-100" id="activity-heading">Simulated negotiation activity</h2>
          <p className="mt-1 text-[9px] leading-4 text-slate-500">Local demo activity only. This is not a real-time conversation.</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-white/[0.1] px-3 py-5 text-center">
          <p className="text-[10px] text-slate-400">No demo activity yet</p>
          <p className="mt-1 text-[9px] text-slate-600">Generate a counteroffer preview to add local sample activity.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {[...entries].sort((first, second) => first.timestamp - second.timestamp).map((entry) => (
            <li className="relative flex gap-3" key={entry.id}>
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                entry.type === 'counteroffer'
                  ? 'border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] text-[#c7f36a]'
                  : 'border-sky-300/15 bg-sky-300/[0.05] text-sky-200'
              }`}>
                {entry.type === 'counteroffer'
                  ? <ArrowUpRight size={13} aria-hidden="true" />
                  : <Sparkles size={13} aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-[#0c100d] p-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className={`text-[9px] font-semibold uppercase tracking-wide ${entry.type === 'counteroffer' ? 'text-[#d8f2a9]' : 'text-sky-200'}`}>
                    {entry.type === 'counteroffer' ? 'Client counteroffer preview' : 'Fictional demo response'}
                  </p>
                  <time className="text-[8px] text-slate-600" dateTime={new Date(entry.timestamp).toISOString()}>
                    {new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(entry.timestamp)}
                  </time>
                </div>
                {entry.type === 'counteroffer' ? (
                  <div className="mt-2 space-y-1 text-[9px] leading-4 text-slate-400">
                    <p>Original illustrative quote: <span className="text-slate-200">{formatINR(originalQuote)}</span></p>
                    <p>Client&apos;s proposed counteroffer: <span className="font-medium text-slate-100">{formatINR(entry.price)}</span></p>
                    <p className="flex flex-wrap items-center gap-1">
                      Price difference: <span className="text-slate-200">{formatINR(entry.price - originalQuote)}</span>
                      {entry.price < originalQuote
                        ? <ArrowDownRight className="text-rose-300" size={12} aria-label="Below the original quote" />
                        : entry.price > originalQuote
                          ? <ArrowUpRight className="text-[#bddf82]" size={12} aria-label="Above the original quote" />
                          : null}
                      <span className="text-slate-500">({formatPercent((entry.price - originalQuote) / originalQuote)})</span>
                    </p>
                    <p>Proposed timeline: <span className="text-slate-200">{entry.timeline}</span></p>
                  </div>
                ) : (
                  <p className="mt-2 text-[9px] leading-5 text-slate-300">{entry.message}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default NegotiationActivity
