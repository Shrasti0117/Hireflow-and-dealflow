import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CircleHelp, FileText, ShieldAlert, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DealSummaryPreview from '../components/DealSummaryPreview.jsx'
import NegotiationActivity from '../components/NegotiationActivity.jsx'
import NegotiationTerms from '../components/NegotiationTerms.jsx'
import getNegotiationTemplate from '../utils/negotiationTemplates.js'

const allowedTimelines = ['1–2 weeks', '3–4 weeks', '4–6 weeks', '1–2 months', '3+ months']

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

function isValidProject(project) {
  return Boolean(
    project
    && typeof project.title === 'string'
    && project.title.trim()
    && typeof project.category === 'string'
    && project.category.trim()
    && typeof project.description === 'string'
    && project.description.trim()
    && Number.isFinite(Number(project.budget))
    && Number(project.budget) > 0
    && typeof project.timeline === 'string'
    && project.timeline
    && Array.isArray(project.skills)
    && project.skills.length > 0
    && project.skills.every((skill) => typeof skill === 'string' && skill.trim()),
  )
}

function isValidProvider(provider) {
  return Boolean(
    provider
    && typeof provider.displayName === 'string'
    && provider.displayName.trim()
    && typeof provider.specialty === 'string'
    && provider.specialty.trim()
    && Number.isFinite(Number(provider.proposedBudget))
    && Number(provider.proposedBudget) > 0
    && typeof provider.delivery === 'string'
    && provider.delivery.trim()
    && typeof provider.profileStatus === 'string'
    && provider.profileStatus.trim(),
  )
}

function validateTerms(terms, providerDelivery) {
  const errors = {}
  const price = Number(terms.price)

  if (!terms.price || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a proposed price greater than ₹0.'
  }
  if (!terms.timeline || (!allowedTimelines.includes(terms.timeline) && terms.timeline !== providerDelivery)) {
    errors.timeline = 'Select a valid proposed delivery timeline.'
  }
  if (
    terms.deliverables.length === 0
    || terms.deliverables.some((deliverable) => typeof deliverable !== 'string' || !deliverable.trim())
  ) {
    errors.deliverables = 'Add at least one deliverable and complete every listed item.'
  }
  const validMilestones = terms.milestones.length > 0 && terms.milestones.every((milestone) => {
    const percentage = Number(milestone.percentage)
    return milestone.name.trim()
      && milestone.description.trim()
      && milestone.percentage !== ''
      && Number.isFinite(percentage)
      && percentage >= 0
      && percentage <= 100
  })
  const percentageTotal = terms.milestones.reduce((total, milestone) => total + Number(milestone.percentage), 0)

  if (!validMilestones) {
    errors.milestones = 'Complete every milestone and enter a percentage from 0 to 100.'
  } else if (Math.abs(percentageTotal - 100) > 0.0000001) {
    errors.milestones = `Milestone percentages must total exactly 100% (currently ${percentageTotal}%).`
  }

  return errors
}

function getMilestoneTotal(milestones) {
  if (milestones.length === 0 || milestones.some((milestone) => (
    milestone.percentage === ''
    || !Number.isFinite(Number(milestone.percentage))
    || Number(milestone.percentage) < 0
    || Number(milestone.percentage) > 100
  ))) {
    return Number.NaN
  }

  return milestones.reduce((total, milestone) => total + Number(milestone.percentage), 0)
}

function getInitialTerms(project, selectedProvider, restoredTerms) {
  const template = getNegotiationTemplate(project?.category)

  if (
    restoredTerms
    && Number.isFinite(Number(restoredTerms.price))
    && restoredTerms.timeline
    && Array.isArray(restoredTerms.deliverables)
    && Array.isArray(restoredTerms.milestones)
  ) {
    return {
      price: String(restoredTerms.price),
      timeline: restoredTerms.timeline,
      deliverables: [...restoredTerms.deliverables],
      milestones: restoredTerms.milestones.map((milestone) => ({ ...milestone })),
    }
  }

  return {
    price: isValidProvider(selectedProvider) ? String(selectedProvider.proposedBudget) : '',
    timeline: isValidProvider(selectedProvider) ? selectedProvider.delivery : '',
    ...template,
  }
}

function ProjectProviderSummary({ project, selectedProvider }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-labelledby="selected-deal-heading">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-[#d8f2a9]">
          <FileText size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-[#c7f36a]">PROJECT & SELECTED PROFILE</p>
          <h2 className="mt-1 break-words text-sm font-semibold text-slate-100" id="selected-deal-heading">{project.title}</h2>
          <p className="mt-1 text-[9px] text-slate-400">{project.category}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.07] bg-[#0c100d] p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words text-[11px] font-semibold text-slate-100">{selectedProvider.displayName}</p>
            <p className="mt-1 break-words text-[9px] leading-4 text-slate-400">{selectedProvider.specialty}</p>
          </div>
          <span className="shrink-0 rounded-md border border-[#c7f36a]/15 bg-[#c7f36a]/[0.05] px-2 py-1 text-[8px] text-[#d8f2a9]">
            {selectedProvider.profileStatus}
          </span>
        </div>
        <p className="mt-2 text-[9px] leading-4 text-slate-500">
          Illustrative quote {formatINR(Number(selectedProvider.proposedBudget))} · illustrative delivery {selectedProvider.delivery}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
        <div>
          <dt className="text-[8px] text-slate-500">Original project budget</dt>
          <dd className="mt-1 text-[10px] text-slate-200">{formatINR(Number(project.budget))} <span className="text-slate-600">(estimate)</span></dd>
        </div>
        <div>
          <dt className="text-[8px] text-slate-500">Project timeline</dt>
          <dd className="mt-1 text-[10px] text-slate-200">{project.timeline}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-white/[0.07] pt-3">
        <p className="text-[8px] text-slate-500">Required project skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {project.skills.map((skill) => (
            <span className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[8px] text-slate-300" key={skill}>{skill}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function MissingNegotiationState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-slate-100">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">Negotiation details unavailable</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">
        Select a provider from your project matching page before starting a negotiation preview.
      </p>
      <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          to="/project/matching"
        >
          Back to Provider Matching <ArrowRight size={14} aria-hidden="true" />
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

function NegotiationPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const project = location.state?.project
  const selectedProvider = location.state?.selectedProvider
  const [terms, setTerms] = useState(() => getInitialTerms(project, selectedProvider, location.state?.terms))
  const [errors, setErrors] = useState({})
  const [activity, setActivity] = useState([])
  const [summaryVisible, setSummaryVisible] = useState(false)

  const hasValidData = isValidProject(project) && isValidProvider(selectedProvider)
  const milestoneTotal = useMemo(() => getMilestoneTotal(terms.milestones), [terms.milestones])
  const currentValidation = useMemo(
    () => validateTerms(terms, selectedProvider?.delivery),
    [terms, selectedProvider?.delivery],
  )
  const hasValidTerms = Object.keys(currentValidation).length === 0

  if (!hasValidData) return <MissingNegotiationState />

  const updateTerms = (event) => {
    const { name, value } = event.target
    setTerms((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const updateDeliverable = (index, value) => {
    setTerms((current) => ({
      ...current,
      deliverables: current.deliverables.map((item, itemIndex) => itemIndex === index ? value : item),
    }))
    setErrors((current) => ({ ...current, deliverables: '' }))
  }

  const updateMilestone = (index, field, value) => {
    setTerms((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) => (
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone
      )),
    }))
    setErrors((current) => ({ ...current, milestones: '' }))
  }

  const addDeliverable = () => {
    setTerms((current) => ({ ...current, deliverables: [...current.deliverables, ''] }))
  }

  const removeDeliverable = (index) => {
    setTerms((current) => ({
      ...current,
      deliverables: current.deliverables.filter((_, itemIndex) => itemIndex !== index),
    }))
    setErrors((current) => ({ ...current, deliverables: '' }))
  }

  const addMilestone = () => {
    setTerms((current) => ({
      ...current,
      milestones: [...current.milestones, { name: '', description: '', percentage: '0' }],
    }))
  }

  const removeMilestone = (index) => {
    setTerms((current) => ({
      ...current,
      milestones: current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index),
    }))
    setErrors((current) => ({ ...current, milestones: '' }))
  }

  const getErrors = () => {
    const nextErrors = validateTerms(terms, selectedProvider.delivery)
    setErrors(nextErrors)
    return nextErrors
  }

  const generateCounteroffer = () => {
    const nextErrors = getErrors()
    if (Object.keys(nextErrors).length > 0) return

    const timestamp = Math.max(
      Date.now(),
      ...activity.map((entry) => entry.timestamp + 1),
    )
    const price = Number(terms.price)
    const newEntries = [
      {
        id: `${timestamp}-counteroffer`,
        type: 'counteroffer',
        timestamp,
        price,
        timeline: terms.timeline,
      },
      {
        id: `${timestamp + 1}-response`,
        type: 'response',
        timestamp: timestamp + 1,
        message: 'Demo response: The provider would like to review the proposed price and delivery schedule. This is an illustrative response, not a real provider message or acceptance.',
      },
    ]

    // A real negotiation engine, backend persistence, provider responses, and formal agreements will be implemented later.
    setActivity((current) => [...current, ...newEntries])
  }

  const previewSummary = () => {
    if (Object.keys(getErrors()).length > 0) return
    setSummaryVisible(true)
  }

  const continueToAgreement = () => {
    if (Object.keys(getErrors()).length > 0) return
    navigate('/project/agreement', {
      state: {
        project,
        selectedProvider,
        terms: {
          ...terms,
          price: Number(terms.price),
          deliverables: [...terms.deliverables],
          milestones: terms.milestones.map((milestone) => ({ ...milestone })),
        },
      },
    })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0c0b] text-slate-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1160px] items-center px-4 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]" aria-label="Breadcrumb">
            <Link className="text-slate-500 transition-colors hover:text-slate-200" to="/dashboard">Dashboard</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <Link className="text-slate-500 transition-colors hover:text-slate-200" to="/project/matching" state={{ project }}>Provider Matching</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="truncate font-medium text-slate-200" aria-current="page">Negotiation Preview</span>
          </nav>
        </div>
      </header>

      <motion.main
        className="mx-auto w-full max-w-[1160px] px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <section className="mb-5">
          <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-300/[0.05] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-100">
            <Sparkles size={11} aria-hidden="true" /> SIMULATED NEGOTIATION
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-3xl">Let&apos;s shape a deal</h1>
          <p className="mt-2 max-w-[760px] text-[10px] leading-5 text-slate-400 sm:text-[11px]">
            Explore pricing, delivery timelines, deliverables, and milestones before moving toward a formal agreement.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2.5">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-100/80" size={14} aria-hidden="true" />
            <p className="text-[9px] leading-5 text-slate-400">
              This is an interactive demo. No messages are sent to a real provider, no offer is accepted by another party, and no contract or payment is created.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
          <div className="min-w-0 space-y-5">
            <NegotiationTerms
              terms={terms}
              originalQuote={Number(selectedProvider.proposedBudget)}
              errors={errors}
              milestoneTotal={milestoneTotal}
              hasValidTerms={hasValidTerms}
              onChange={updateTerms}
              onDeliverableChange={updateDeliverable}
              onAddDeliverable={addDeliverable}
              onRemoveDeliverable={removeDeliverable}
              onMilestoneChange={updateMilestone}
              onAddMilestone={addMilestone}
              onRemoveMilestone={removeMilestone}
              onGenerateCounteroffer={generateCounteroffer}
              onPreviewSummary={previewSummary}
            />
            {summaryVisible && hasValidTerms && (
              <DealSummaryPreview
                project={project}
                selectedProvider={selectedProvider}
                terms={terms}
                onEdit={() => setSummaryVisible(false)}
                onContinue={continueToAgreement}
              />
            )}
          </div>

          <aside className="min-w-0 space-y-5">
            <ProjectProviderSummary project={project} selectedProvider={selectedProvider} />
            <NegotiationActivity
              entries={activity}
              originalQuote={Number(selectedProvider.proposedBudget)}
            />
          </aside>
        </div>
        <p className="mt-5 text-center text-[8px] leading-4 text-slate-600">
          All terms, activity, and responses are temporary demo state in this page and are not saved.
        </p>
      </motion.main>
    </div>
  )
}

export default NegotiationPreview
