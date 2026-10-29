import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleHelp,
  FileText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import getMilestoneAmounts from '../utils/milestoneAmounts.js'

const allowedTimelines = ['1–2 weeks', '3–4 weeks', '4–6 weeks', '1–2 months', '3+ months']

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

function isValidAgreementData(project, selectedProvider, terms) {
  if (
    !project
    || typeof project.title !== 'string'
    || !project.title.trim()
    || typeof project.category !== 'string'
    || !project.category.trim()
    || typeof project.description !== 'string'
    || !project.description.trim()
    || !Number.isFinite(Number(project.budget))
    || Number(project.budget) <= 0
    || !project.timeline
    || !Array.isArray(project.skills)
    || project.skills.length === 0
    || !project.skills.every((skill) => typeof skill === 'string' && skill.trim())
  ) {
    return false
  }

  if (
    !selectedProvider
    || typeof selectedProvider.displayName !== 'string'
    || !selectedProvider.displayName.trim()
    || typeof selectedProvider.specialty !== 'string'
    || !selectedProvider.specialty.trim()
    || typeof selectedProvider.profileStatus !== 'string'
    || !selectedProvider.profileStatus.trim()
    || !Number.isFinite(Number(selectedProvider.proposedBudget))
    || Number(selectedProvider.proposedBudget) <= 0
    || typeof selectedProvider.delivery !== 'string'
    || !selectedProvider.delivery.trim()
  ) {
    return false
  }

  if (
    !terms
    || !Number.isFinite(Number(terms.price))
    || Number(terms.price) <= 0
    || typeof terms.timeline !== 'string'
    || (!allowedTimelines.includes(terms.timeline) && terms.timeline !== selectedProvider.delivery)
    || !Array.isArray(terms.deliverables)
    || terms.deliverables.length === 0
    || !terms.deliverables.every((deliverable) => typeof deliverable === 'string' && deliverable.trim())
    || !Array.isArray(terms.milestones)
    || terms.milestones.length === 0
  ) {
    return false
  }

  const validMilestones = terms.milestones.every((milestone) => (
    milestone
    && typeof milestone.name === 'string'
    && milestone.name.trim()
    && typeof milestone.description === 'string'
    && milestone.description.trim()
    && milestone.percentage !== ''
    && Number.isFinite(Number(milestone.percentage))
    && Number(milestone.percentage) >= 0
    && Number(milestone.percentage) <= 100
  ))
  const percentageTotal = terms.milestones.reduce((total, milestone) => total + Number(milestone.percentage), 0)

  return validMilestones && Math.abs(percentageTotal - 100) < 0.0000001
}

function MissingAgreementState({ project, selectedProvider, terms }) {
  const previousState = { project, selectedProvider, terms }
  const hasProject = Boolean(project?.title)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-slate-100">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#c7f36a]">PREVIEW ONLY · NOT SIGNED</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Agreement preview unavailable</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">
        {project || selectedProvider || terms
          ? 'Some project, provider, or proposed terms are missing or invalid. Return to negotiation to review them; no agreement details have been created.'
          : 'Agreement details are not available. Return to negotiation with a selected demo provider and reviewed proposed terms.'}
      </p>
      <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          to={hasProject ? '/project/negotiation' : '/project/matching'}
          state={hasProject ? previousState : { project }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {hasProject ? 'Back to Negotiation' : 'Back to Provider Matching'}
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 hover:bg-white/[0.04]"
          to="/dashboard"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  )
}

function AgreementPreview() {
  const location = useLocation()
  const { project, selectedProvider, terms } = location.state ?? {}
  const reduceMotion = useReducedMotion()
  const [hasReviewed, setHasReviewed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [previewSession] = useState(() => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase()
    return {
      createdAt: new Date(timestamp),
      reference: `DF-DEMO-${timestamp.toString(36).toUpperCase()}-${randomSuffix}`,
    }
  })

  if (!isValidAgreementData(project, selectedProvider, terms)) {
    return <MissingAgreementState project={project} selectedProvider={selectedProvider} terms={terms} />
  }

  const price = Number(terms.price)
  const milestoneAmounts = getMilestoneAmounts(terms.milestones, price)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0c0b] text-slate-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1080px] items-center px-4 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]" aria-label="Breadcrumb">
            <Link className="text-slate-500 transition-colors hover:text-slate-200" to="/dashboard">Dashboard</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <Link
              className="text-slate-500 transition-colors hover:text-slate-200"
              to="/project/matching"
              state={{ project }}
            >
              Provider Matching
            </Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="truncate font-medium text-slate-200" aria-current="page">Agreement Preview</span>
          </nav>
        </div>
      </header>

      <motion.main
        className="mx-auto w-full max-w-[900px] px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <section className="mb-5">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#d8f2a9]">
              <Sparkles size={11} aria-hidden="true" /> PREVIEW ONLY
            </span>
            <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-300/[0.05] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-100">
              <ShieldAlert size={11} aria-hidden="true" /> NOT SIGNED
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-3xl">Agreement Preview</h1>
          <p className="mt-2 max-w-[680px] text-[10px] leading-5 text-slate-400 sm:text-[11px]">
            Review the project and proposed terms below. This preview is for discussion only and has not been accepted by the selected provider.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101411] shadow-[0_20px_70px_rgba(0,0,0,0.2)]" aria-labelledby="agreement-title">
          <div className="border-b border-white/[0.08] bg-white/[0.015] px-4 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-[#c7f36a]">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-500">DEALFLOW AI · DEMO DOCUMENT</p>
                  <h2 className="mt-1 break-words text-lg font-semibold tracking-[-0.035em] text-slate-100 sm:text-xl" id="agreement-title">
                    Proposed Deal Summary
                  </h2>
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-[#0b0e0c] px-3 py-2 sm:text-right">
                <p className="text-[8px] text-slate-500">Demo reference · not a stored contract ID</p>
                <p className="mt-1 break-all font-mono text-[9px] text-slate-300">{previewSession.reference}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[8px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} aria-hidden="true" />
                Local preview date: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(previewSession.createdAt)}
              </span>
              <span>No signing date or official record</span>
            </div>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-7 sm:py-6">
            <section aria-labelledby="project-details-heading">
              <SectionHeading id="project-details-heading" title="Project details" />
              <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Project title">{project.title}</InfoItem>
                <InfoItem label="Category">{project.category}</InfoItem>
                <InfoItem label="Client">Client details are not supplied in this demo.</InfoItem>
                <InfoItem label="Original project budget">{formatINR(Number(project.budget))} <span className="text-slate-600">(estimate)</span></InfoItem>
                <div className="sm:col-span-2">
                  <InfoItem label="Project description">
                    <span className="whitespace-pre-wrap">{project.description}</span>
                  </InfoItem>
                </div>
                <div className="sm:col-span-2">
                  <InfoItem label="Required skills">
                    <span className="flex flex-wrap gap-1.5">
                      {project.skills.map((skill) => (
                        <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[8px] text-slate-300" key={skill}>{skill}</span>
                      ))}
                    </span>
                  </InfoItem>
                </div>
              </dl>
            </section>

            <section className="border-t border-white/[0.07] pt-5" aria-labelledby="provider-details-heading">
              <SectionHeading id="provider-details-heading" title="Selected demo provider" />
              <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0c100d] p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-[12px] font-semibold text-slate-100">{selectedProvider.displayName}</p>
                    <p className="mt-1 break-words text-[9px] text-slate-400">{selectedProvider.specialty}</p>
                  </div>
                  <span className="self-start rounded-md border border-[#c7f36a]/15 bg-[#c7f36a]/[0.05] px-2 py-1 text-[8px] text-[#d8f2a9]">
                    {selectedProvider.profileStatus}
                  </span>
                </div>
                <p className="mt-3 text-[9px] leading-4 text-slate-500">
                  Illustrative profile quote: {formatINR(Number(selectedProvider.proposedBudget))} · illustrative delivery estimate: {selectedProvider.delivery}
                </p>
              </div>
            </section>

            <section className="border-t border-white/[0.07] pt-5" aria-labelledby="proposed-terms-heading">
              <SectionHeading id="proposed-terms-heading" title="Proposed terms · not accepted" />
              <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Proposed price">{formatINR(price)} <span className="text-slate-600">({terms.currency || 'INR'})</span></InfoItem>
                <InfoItem label="Proposed delivery timeline">{terms.timeline}</InfoItem>
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section className="rounded-lg border border-white/[0.07] bg-[#0c100d] p-3.5">
                  <h3 className="text-[9px] font-semibold text-slate-200">Proposed deliverables</h3>
                  <ul className="mt-2 space-y-2">
                    {terms.deliverables.map((deliverable, index) => (
                      <li className="flex gap-2 text-[9px] leading-4 text-slate-400" key={`${index}-${deliverable}`}>
                        <span className="text-[#bddf82]" aria-hidden="true">•</span><span className="break-words">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-lg border border-white/[0.07] bg-[#0c100d] p-3.5">
                  <h3 className="text-[9px] font-semibold text-slate-200">Milestones and payment schedule</h3>
                  <p className="mt-1 text-[8px] leading-4 text-slate-600">Illustrative schedule based on the proposed milestone shares; no payments are scheduled or initiated.</p>
                  <ol className="mt-3 space-y-2.5">
                    {terms.milestones.map((milestone, index) => (
                      <li className="rounded-md border border-white/[0.06] bg-[#0a0c0b] p-2.5" key={`${index}-${milestone.name}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0 break-words text-[9px] font-medium text-slate-200">{milestone.name}</span>
                          <span className="shrink-0 rounded border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">{milestone.percentage}%</span>
                        </div>
                        <p className="mt-1 break-words text-[8px] leading-4 text-slate-500">{milestone.description}</p>
                        <p className="mt-1.5 text-[8px] text-[#d8f2a9]">Illustrative amount: {formatINR(milestoneAmounts[index])}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-right text-[8px] text-slate-500">
                    Total: {formatINR(milestoneAmounts.reduce((total, amount) => total + amount, 0))}
                  </p>
                </section>
              </div>
            </section>
          </div>

          <div className="border-t border-white/[0.08] bg-[#0c100d] px-4 py-4 sm:px-7 sm:py-5">
            {!confirmed ? (
              <div className="space-y-4">
                <p className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2.5 text-[9px] leading-5 text-slate-400">
                  <ShieldAlert className="mt-0.5 shrink-0 text-amber-100/80" size={13} aria-hidden="true" />
                  This preview is not signed and has not been accepted by the other party. It is not stored and does not initiate a payment.
                </p>
                <label className="flex cursor-pointer items-start gap-2.5 text-[10px] leading-5 text-slate-300">
                  <input
                    className="mt-1 h-4 w-4 shrink-0 accent-[#c7f36a] focus-visible:outline-[#c7f36a]"
                    checked={hasReviewed}
                    onChange={(event) => setHasReviewed(event.target.checked)}
                    type="checkbox"
                  />
                  <span>I have reviewed these proposed terms. I understand this confirmation applies only to the frontend demo preview.</span>
                </label>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-[9px] font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    to="/project/negotiation"
                    state={{ project, selectedProvider, terms }}
                  >
                    <ArrowLeft size={13} aria-hidden="true" /> Return to Negotiation to edit
                  </Link>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[9px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!hasReviewed}
                    onClick={() => setConfirmed(true)}
                    title={!hasReviewed ? 'Review the proposed terms before confirming this demo preview.' : undefined}
                    type="button"
                  >
                    <Check size={13} aria-hidden="true" /> Confirm Preview &amp; Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.045] p-4" role="status">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] text-[#c7f36a]">
                    <Check size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-100">You reviewed the proposed terms</h3>
                    <p className="mt-1.5 text-[9px] leading-5 text-slate-400">
                      This confirmation is frontend demo state only. No legal agreement has been signed, no agreement has been stored, and no payment has been initiated. The selected provider has not accepted these terms.
                    </p>
                    <button
                      className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-[9px] font-medium text-slate-300 hover:bg-white/[0.04]"
                      onClick={() => {
                        setConfirmed(false)
                        setHasReviewed(false)
                      }}
                      type="button"
                    >
                      Return to preview review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-[8px] leading-4 text-slate-600">
          This demo reference and local preview date are generated in this browser session; they do not represent a stored contract or signing record.
        </p>
      </motion.main>
    </div>
  )
}

function SectionHeading({ id, title }) {
  return <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300" id={id}>{title}</h3>
}

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-[9px] leading-5 text-slate-200">{children}</dd>
    </div>
  )
}

export default AgreementPreview
