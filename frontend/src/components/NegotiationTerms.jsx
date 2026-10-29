import { Plus, Trash2 } from 'lucide-react'

const timelines = ['1–2 weeks', '3–4 weeks', '4–6 weeks', '1–2 months', '3+ months']

function NegotiationTerms({
  terms,
  originalQuote,
  errors,
  milestoneTotal,
  hasValidTerms,
  onChange,
  onDeliverableChange,
  onAddDeliverable,
  onRemoveDeliverable,
  onMilestoneChange,
  onAddMilestone,
  onRemoveMilestone,
  onGenerateCounteroffer,
  onPreviewSummary,
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-labelledby="terms-heading">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-100" id="terms-heading">Proposed deal terms</h2>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">Adjust these provisional suggestions for your review. Nothing here is an accepted offer.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-[10px] font-medium text-slate-200" htmlFor="proposed-price">
            Proposed price <span className="text-rose-300" aria-hidden="true">*</span>
          </label>
          <div className={`flex min-h-11 items-center rounded-lg border bg-[#0b0e0c] transition focus-within:border-[#c7f36a]/50 focus-within:ring-2 focus-within:ring-[#c7f36a]/10 ${errors.price ? 'border-rose-400/50' : 'border-white/10'}`}>
            <span className="pl-3.5 text-[12px] text-slate-400" aria-hidden="true">₹</span>
            <input
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-[11px] text-slate-100 outline-none placeholder:text-slate-600"
              id="proposed-price"
              min="0.01"
              name="price"
              onChange={onChange}
              placeholder="Enter a proposed amount"
              step="0.01"
              type="number"
              value={terms.price}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'proposed-price-error' : 'original-quote-help'}
            />
            <span className="pr-3.5 text-[10px] text-slate-500">INR</span>
          </div>
          <p className="text-[9px] leading-4 text-slate-500" id="original-quote-help">
            Provider&apos;s original illustrative quote: ₹{new Intl.NumberFormat('en-IN').format(originalQuote)}
          </p>
          {errors.price && <p className="text-[10px] text-rose-300" id="proposed-price-error" role="alert">{errors.price}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-medium text-slate-200" htmlFor="proposed-timeline">
            Proposed delivery timeline <span className="text-rose-300" aria-hidden="true">*</span>
          </label>
          <select
            className={`min-h-11 w-full rounded-lg border bg-[#0b0e0c] px-3 text-[11px] text-slate-100 outline-none transition focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${errors.timeline ? 'border-rose-400/50' : 'border-white/10'}`}
            id="proposed-timeline"
            name="timeline"
            onChange={onChange}
            value={terms.timeline}
            aria-invalid={Boolean(errors.timeline)}
            aria-describedby={errors.timeline ? 'proposed-timeline-error' : undefined}
          >
            <option value="">Select a timeline</option>
            {terms.timeline && !timelines.includes(terms.timeline) && (
              <option value={terms.timeline}>{terms.timeline} (provider&apos;s illustrative estimate)</option>
            )}
            {timelines.map((timeline) => <option key={timeline} value={timeline}>{timeline}</option>)}
          </select>
          {errors.timeline && <p className="text-[10px] text-rose-300" id="proposed-timeline-error" role="alert">{errors.timeline}</p>}
        </div>

        <section className="space-y-3" aria-labelledby="deliverables-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-100" id="deliverables-heading">Deliverables</h3>
              <p className="mt-1 text-[9px] text-slate-500">Category-based suggestions — edit these to fit the project.</p>
            </div>
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-white/10 px-2.5 text-[9px] text-slate-300 hover:bg-white/[0.04]"
              type="button"
              onClick={onAddDeliverable}
            >
              <Plus size={12} aria-hidden="true" /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {terms.deliverables.map((deliverable, index) => (
              <div className="flex items-center gap-2" key={`deliverable-${index}`}>
                <label className="sr-only" htmlFor={`deliverable-${index}`}>Deliverable {index + 1}</label>
                <input
                  className={`min-h-10 min-w-0 flex-1 rounded-lg border bg-[#0b0e0c] px-3 text-[10px] text-slate-200 outline-none focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${errors.deliverables && !deliverable.trim() ? 'border-rose-400/50' : 'border-white/10'}`}
                  id={`deliverable-${index}`}
                  onChange={(event) => onDeliverableChange(index, event.target.value)}
                  value={deliverable}
                />
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.04] hover:text-rose-300 disabled:opacity-40"
                  type="button"
                  onClick={() => onRemoveDeliverable(index)}
                  disabled={terms.deliverables.length <= 1}
                  aria-label={`Remove deliverable ${index + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          {errors.deliverables && <p className="text-[10px] text-rose-300" role="alert">{errors.deliverables}</p>}
        </section>

        <section className="space-y-3" aria-labelledby="milestones-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-100" id="milestones-heading">Milestones</h3>
              <p className="mt-1 text-[9px] leading-4 text-slate-500">Provisional suggestions — review and adjust names, descriptions, and shares.</p>
            </div>
            <button
              className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-white/10 px-2.5 text-[9px] text-slate-300 hover:bg-white/[0.04]"
              type="button"
              onClick={onAddMilestone}
            >
              <Plus size={12} aria-hidden="true" /> Add milestone
            </button>
          </div>

          <div className="space-y-3">
            {terms.milestones.map((milestone, index) => (
              <div className="rounded-lg border border-white/[0.07] bg-[#0c100d] p-3" key={`milestone-${index}`}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="sr-only" htmlFor={`milestone-name-${index}`}>Milestone {index + 1} name</label>
                    <input
                      className={`min-h-9 w-full rounded-md border bg-[#0a0c0b] px-2.5 text-[10px] text-slate-200 outline-none focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${errors.milestones && !milestone.name.trim() ? 'border-rose-400/50' : 'border-white/[0.08]'}`}
                      id={`milestone-name-${index}`}
                      onChange={(event) => onMilestoneChange(index, 'name', event.target.value)}
                      placeholder="Milestone name"
                      value={milestone.name}
                    />
                    <label className="sr-only" htmlFor={`milestone-description-${index}`}>Milestone {index + 1} description</label>
                    <textarea
                      className={`min-h-[60px] w-full resize-y rounded-md border bg-[#0a0c0b] px-2.5 py-2 text-[10px] leading-4 text-slate-300 outline-none focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${errors.milestones && !milestone.description.trim() ? 'border-rose-400/50' : 'border-white/[0.08]'}`}
                      id={`milestone-description-${index}`}
                      onChange={(event) => onMilestoneChange(index, 'description', event.target.value)}
                      placeholder="Description"
                      value={milestone.description}
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:w-[120px] sm:flex-col sm:items-stretch">
                    <div className="min-w-0 flex-1 sm:flex-none">
                      <label className="mb-1 block text-[8px] text-slate-500" htmlFor={`milestone-percent-${index}`}>Budget share %</label>
                      <div className="relative">
                        <input
                          className={`min-h-9 w-full rounded-md border bg-[#0a0c0b] px-2.5 pr-7 text-[10px] text-slate-200 outline-none focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${errors.milestones && (milestone.percentage === '' || Number(milestone.percentage) < 0 || Number(milestone.percentage) > 100) ? 'border-rose-400/50' : 'border-white/[0.08]'}`}
                          id={`milestone-percent-${index}`}
                          max="100"
                          min="0"
                          onChange={(event) => onMilestoneChange(index, 'percentage', event.target.value)}
                          step="1"
                          type="number"
                          value={milestone.percentage}
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">%</span>
                      </div>
                    </div>
                    <button
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.04] hover:text-rose-300 disabled:opacity-40 sm:self-end"
                      type="button"
                      onClick={() => onRemoveMilestone(index)}
                      disabled={terms.milestones.length <= 1}
                      aria-label={`Remove milestone ${index + 1}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${milestoneTotal === 100 ? 'border-[#c7f36a]/20 bg-[#c7f36a]/[0.045]' : 'border-amber-400/20 bg-amber-400/[0.04]'}`}>
            <span className="text-[10px] text-slate-300">Milestone percentage total</span>
            <span className={`text-[11px] font-semibold ${milestoneTotal === 100 ? 'text-[#d8f2a9]' : 'text-amber-200'}`} aria-live="polite">
              {Number.isFinite(milestoneTotal) ? `${milestoneTotal}%` : 'Invalid values'}
            </span>
          </div>
          {errors.milestones && (
            <p className="text-[10px] leading-4 text-rose-300" role="alert">
              {errors.milestones}
            </p>
          )}
          {milestoneTotal !== 100 && !errors.milestones && (
            <p className="text-[9px] leading-4 text-amber-200/80">
              Milestone shares must add up to exactly 100% before a counteroffer or summary can be previewed.
            </p>
          )}
        </section>

        <div className="border-t border-white/[0.07] pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c]"
              type="button"
              onClick={onGenerateCounteroffer}
            >
              Generate Counteroffer Preview
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={onPreviewSummary}
              disabled={!hasValidTerms}
              title={!hasValidTerms ? 'Enter valid terms with milestone percentages totaling 100% first.' : undefined}
            >
              Preview Proposed Deal Summary
            </button>
          </div>
          <p className="mt-2 text-[9px] leading-4 text-slate-600">These controls update local demo state only. No network request is made.</p>
        </div>
      </div>
    </section>
  )
}

export default NegotiationTerms
