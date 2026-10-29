import { ArrowLeft, ArrowRight, FileText } from 'lucide-react'
import getMilestoneAmounts from '../utils/milestoneAmounts.js'

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

function DealSummaryPreview({ project, selectedProvider, terms, onEdit, onContinue }) {
  const price = Number(terms.price)
  const amounts = getMilestoneAmounts(terms.milestones, price)

  return (
    <section className="rounded-2xl border border-[#c7f36a]/20 bg-[#11170e] p-4 sm:p-6" aria-labelledby="deal-summary-heading">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] text-[#c7f36a]">
          <FileText size={16} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-[#bddf82]">PREVIEW ONLY</p>
          <h2 className="mt-1 text-base font-semibold text-slate-100" id="deal-summary-heading">
            Proposed Deal Summary — Not an Agreement
          </h2>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
        <SummaryItem label="Project">{project.title}</SummaryItem>
        <SummaryItem label="Selected demo provider">{selectedProvider.displayName} <span className="text-slate-500">(fictional profile)</span></SummaryItem>
        <SummaryItem label="Proposed price">{formatINR(price)}</SummaryItem>
        <SummaryItem label="Proposed delivery timeline">{terms.timeline}</SummaryItem>
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
        <section>
          <h3 className="text-[10px] font-semibold text-slate-200">Proposed deliverables</h3>
          <ul className="mt-2 space-y-2">
            {terms.deliverables.map((deliverable, index) => (
              <li className="break-words text-[9px] leading-4 text-slate-400" key={`${index}-${deliverable}`}>
                <span className="mr-1.5 text-[#bddf82]">•</span>{deliverable}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-[10px] font-semibold text-slate-200">Proposed milestones</h3>
          <ul className="mt-2 space-y-3">
            {terms.milestones.map((milestone, index) => (
              <li className="rounded-lg border border-white/[0.07] bg-[#0b0f0b] p-3" key={`${index}-${milestone.name}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="break-words text-[9px] font-medium text-slate-200">{milestone.name}</p>
                  <span className="shrink-0 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">{milestone.percentage}%</span>
                </div>
                <p className="mt-1 break-words text-[8px] leading-4 text-slate-500">{milestone.description}</p>
                <p className="mt-2 text-[9px] text-[#d8f2a9]">Illustrative amount: {formatINR(amounts[index])}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[8px] text-slate-600">
            Milestone amounts total {formatINR(amounts.reduce((sum, amount) => sum + amount, 0))} after currency rounding.
          </p>
        </section>
      </div>

      <p className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2.5 text-[9px] leading-5 text-slate-400">
        These terms are for demonstration and review only. They have not been accepted by a provider, do not form a binding contract, and do not initiate payment.
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:justify-between">
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-[9px] font-medium text-slate-300 hover:bg-white/[0.04]"
          type="button"
          onClick={onEdit}
        >
          <ArrowLeft size={13} aria-hidden="true" /> Return to editing terms
        </button>
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-3 text-[9px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          type="button"
          onClick={onContinue}
        >
          Continue to Agreement Preview <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function SummaryItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-[10px] leading-5 text-slate-200">{children}</dd>
    </div>
  )
}

export default DealSummaryPreview
