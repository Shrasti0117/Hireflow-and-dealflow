import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  CircleHelp,
  Filter,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProviderCard from '../components/ProviderCard.jsx'
import demoProviders from '../data/demoProviders.js'
import { calculateMatchScore } from '../utils/matchScore.js'

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount)

const sortOptions = [
  { value: 'match', label: 'Best demo match' },
  { value: 'price', label: 'Lowest proposed price' },
  { value: 'delivery', label: 'Fastest delivery' },
]

function isProjectPresent(project) {
  return Boolean(project && typeof project === 'object' && project.title && project.category && project.description)
}

function EmptyProjectState() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-68px)] w-full max-w-[720px] flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-100">Project requirements not found</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">
        Create or review a project brief before comparing providers.
      </p>
      <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          to="/project/new"
        >
          Create Project <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 hover:bg-white/[0.04]"
          to="/dashboard"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}

function ProjectSummary({ project, onEdit }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-labelledby="matching-project-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#c7f36a]">YOUR PROJECT</p>
          <h2 className="mt-1.5 break-words text-base font-semibold tracking-[-0.035em] text-slate-100" id="matching-project-title">{project.title}</h2>
          <p className="mt-1 text-[10px] text-slate-400">{project.category}</p>
        </div>
        <button
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-white/10 px-3 text-[10px] font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          type="button"
          onClick={onEdit}
        >
          Edit Project Requirements
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-3">
        <SummaryItem label="Estimated budget">{project.budget ? formatINR(Number(project.budget)) : 'Not provided'} <span className="text-slate-600">(estimate)</span></SummaryItem>
        <SummaryItem label="Desired timeline">{project.timeline || 'Not provided'}</SummaryItem>
        <div className="sm:col-span-1">
          <SummaryItem label="Required skills">
            {Array.isArray(project.skills) && project.skills.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                  <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[9px] text-slate-300" key={skill}>{skill}</span>
                ))}
              </span>
            ) : 'Not provided'}
          </SummaryItem>
        </div>
      </div>

      <details className="group mt-4 border-t border-white/[0.07] pt-3">
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-100 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="transition-transform group-open:rotate-180" size={14} aria-hidden="true" />
          View project description
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-300">{project.description}</p>
      </details>
    </section>
  )
}

function SummaryItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] text-slate-500">{label}</p>
      <div className="mt-1 break-words text-[10px] leading-5 text-slate-200">{children}</div>
    </div>
  )
}

function ComparisonPanel({ providers, scores, onRemove }) {
  if (providers.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-white/[0.12] bg-[#101411] px-4 py-7 text-center sm:px-6" aria-labelledby="comparison-heading">
        <h2 className="text-sm font-semibold text-slate-100" id="comparison-heading">Compare demo providers</h2>
        <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
          Select up to three profiles above to compare their demo scores, skills, prices, and delivery estimates side by side.
        </p>
        <p className="mt-2 text-[9px] text-slate-600">Your comparison selections are kept for this page session only.</p>
      </section>
    )
  }

  const rows = [
    { label: 'Demo match score', value: (provider) => scores[provider.id]?.score === null ? 'Not enough information' : `${scores[provider.id]?.score ?? 'Not enough information'}%` },
    { label: 'Matching required skills', value: (provider) => {
      const skills = scores[provider.id]?.matchingSkills ?? []
      return skills.length ? skills.join(', ') : 'No required skills matched'
    } },
    { label: 'Proposed budget', value: (provider) => formatINR(provider.proposedBudget) },
    { label: 'Estimated delivery', value: (provider) => provider.delivery },
    { label: 'Specialty', value: (provider) => provider.specialty },
  ]

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-labelledby="comparison-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100" id="comparison-heading">Provider comparison</h2>
          <p className="mt-1 text-[9px] text-slate-500">{providers.length} of 3 demo profiles selected</p>
        </div>
      </div>
      <div className="mt-4 max-w-full overflow-x-auto rounded-lg border border-white/[0.07]">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="bg-white/[0.025]">
              <th className="w-36 px-3 py-3 text-[9px] font-medium text-slate-500">Compare</th>
              {providers.map((provider) => (
                <th className="min-w-[155px] px-3 py-3 align-top" key={provider.id}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="break-words text-[10px] font-semibold leading-4 text-slate-100">{provider.displayName}</span>
                    <button
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 hover:bg-white/[0.06] hover:text-white"
                      type="button"
                      aria-label={`Remove ${provider.displayName} from comparison`}
                      onClick={() => onRemove(provider.id)}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-white/[0.07]" key={row.label}>
                <th className="px-3 py-3 text-[9px] font-medium text-slate-500">{row.label}</th>
                {providers.map((provider) => (
                  <td className="break-words px-3 py-3 text-[9px] leading-4 text-slate-300" key={provider.id}>{row.value(provider)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProviderMatching() {
  const location = useLocation()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const project = location.state?.project
  const [sortBy, setSortBy] = useState('match')
  const [skillFilter, setSkillFilter] = useState('')
  const [comparedIds, setComparedIds] = useState([])
  const [pendingProvider, setPendingProvider] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)

  const providerScores = useMemo(() => Object.fromEntries(
    demoProviders.map((provider) => [provider.id, calculateMatchScore(project, provider)]),
  ), [project])

  const visibleProviders = useMemo(() => {
    const keyword = skillFilter.trim().toLowerCase()
    const filtered = demoProviders.filter((provider) => (
      !keyword || provider.skills.some((skill) => skill.toLowerCase().includes(keyword))
    ))

    return filtered.sort((first, second) => {
      if (sortBy === 'price') return first.proposedBudget - second.proposedBudget
      if (sortBy === 'delivery') return first.deliveryMaxWeeks - second.deliveryMaxWeeks
      const firstScore = providerScores[first.id].score
      const secondScore = providerScores[second.id].score
      if (firstScore === null) return secondScore === null ? 0 : 1
      if (secondScore === null) return -1
      return secondScore - firstScore
    })
  }, [providerScores, skillFilter, sortBy])

  if (!isProjectPresent(project)) return <EmptyProjectState />

  const comparedProviders = comparedIds
    .map((id) => demoProviders.find((provider) => provider.id === id))
    .filter(Boolean)

  const handleCompareChange = (provider, shouldCompare) => {
    setComparedIds((current) => {
      if (shouldCompare) {
        if (current.length >= 3 || current.includes(provider.id)) return current
        return [...current, provider.id]
      }
      return current.filter((id) => id !== provider.id)
    })
  }

  const resetFilters = () => {
    setSkillFilter('')
    setSortBy('match')
  }

  const editProject = () => navigate('/project/new', { state: { projectForm: project } })

  const continueToNegotiation = () => {
    navigate('/project/negotiation', { state: { project, selectedProvider } })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0c0b] text-slate-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1160px] items-center px-4 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]" aria-label="Breadcrumb">
            <Link className="text-slate-500 transition-colors hover:text-slate-200" to="/dashboard">Dashboard</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <button className="text-slate-500 transition-colors hover:text-slate-200" onClick={editProject} type="button">Create Project</button>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="truncate font-medium text-slate-200" aria-current="page">Provider Matching</span>
          </nav>
        </div>
      </header>

      <motion.main
        className="mx-auto w-full max-w-[1160px] space-y-5 px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#d8f2a9]">
              <Sparkles size={11} aria-hidden="true" /> DEMO MATCHING
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-3xl">
              Find the right provider for your project
            </h1>
            <p className="mt-2 max-w-[690px] text-[10px] leading-5 text-slate-400 sm:text-[11px]">
              Compare suitable options by skills, budget, delivery timeline, and project fit.
            </p>
          </div>
          <p className="max-w-[360px] rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-[9px] leading-4 text-slate-400 sm:text-right">
            These sample providers and match scores demonstrate the matching experience. Real provider discovery and AI-powered ranking will be connected in a later step.
          </p>
        </section>

        <ProjectSummary project={project} onEdit={editProject} />

        <section className="rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" aria-label="Provider filters">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-[660px] lg:flex-1">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                  <ArrowUpDown size={12} aria-hidden="true" /> Sort providers
                </span>
                <select
                  className="min-h-10 w-full rounded-lg border border-white/10 bg-[#0b0e0c] px-3 text-[10px] text-slate-200 outline-none focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                  <Search size={12} aria-hidden="true" /> Filter by skill keyword
                </span>
                <span className="relative block">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={13} aria-hidden="true" />
                  <input
                    className="min-h-10 w-full rounded-lg border border-white/10 bg-[#0b0e0c] pl-9 pr-3 text-[10px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10"
                    value={skillFilter}
                    onChange={(event) => setSkillFilter(event.target.value)}
                    placeholder="e.g. React"
                    type="search"
                  />
                </span>
              </label>
            </div>
            <button
              className="inline-flex min-h-9 items-center justify-center gap-1.5 self-start rounded-lg px-2 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100 lg:self-end"
              type="button"
              onClick={resetFilters}
            >
              <X size={13} aria-hidden="true" /> Reset Filters
            </button>
          </div>
          <p className="mt-3 text-[9px] text-slate-500" aria-live="polite">
            Showing <span className="font-medium text-slate-300">{visibleProviders.length}</span> of {demoProviders.length} fictional demo profiles
          </p>
        </section>

        <details className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-100 [&::-webkit-details-marker]:hidden">
            <CircleHelp size={14} aria-hidden="true" /> How this score works
            <span className="ml-auto text-[9px] text-slate-600">expand</span>
          </summary>
          <p className="mt-2 text-[9px] leading-5 text-slate-400">
            Demo match score = required-skill overlap × 50% + budget fit × 30% + timeline fit × 20%. Skill overlap is the share of your required skills listed on the demo profile. Budget fit is 100 when its proposed price is within your estimate; otherwise it decreases proportionally by your budget divided by that proposed price. Timeline fit is 100 when the demo delivery estimate fits your selected timeline; otherwise it decreases proportionally by your timeline allowance divided by its delivery duration. For “3+ months,” any sample delivery in this demo fits the timeline. This simple illustrative formula is not AI-generated or scientifically validated.
          </p>
        </details>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Demo provider profiles">
          {visibleProviders.length > 0 ? visibleProviders.map((provider) => {
            const result = providerScores[provider.id]
            return (
              <ProviderCard
                key={provider.id}
                provider={provider}
                score={result.score}
                matchingSkills={result.matchingSkills}
                isCompared={comparedIds.includes(provider.id)}
                comparisonLimitReached={comparedIds.length >= 3}
                isSelected={selectedProvider?.id === provider.id}
                onCompareChange={handleCompareChange}
                onSelect={setPendingProvider}
              />
            )
          }) : (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center md:col-span-2 xl:col-span-3">
              <p className="text-[11px] font-medium text-slate-300">No demo profiles match that skill keyword.</p>
              <p className="mt-1 text-[9px] text-slate-500">Try another skill or reset the filters.</p>
            </div>
          )}
        </div>

        <ComparisonPanel
          providers={comparedProviders}
          scores={providerScores}
          onRemove={(id) => setComparedIds((current) => current.filter((providerId) => providerId !== id))}
        />

        {pendingProvider && (
          <section className="rounded-2xl border border-[#c7f36a]/25 bg-[#11170e] p-4 sm:p-5" aria-labelledby="selection-confirmation">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] text-[#c7f36a]">
                <Check size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[12px] font-semibold text-slate-100" id="selection-confirmation">Confirm a demo selection</h2>
                <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
                  You are selecting the fictional profile <span className="font-medium text-slate-200">{pendingProvider.displayName}</span> at a proposed price of <span className="font-medium text-slate-200">{formatINR(pendingProvider.proposedBudget)}</span>. This is a UI demo only: no provider will be contacted, no deal or contract will be formed, and no payment will be made.
                </p>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-[10px] font-medium text-slate-300 hover:bg-white/[0.04]"
                    type="button"
                    onClick={() => setPendingProvider(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#c7f36a] px-3 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
                    type="button"
                    onClick={() => {
                      setSelectedProvider(pendingProvider)
                      setPendingProvider(null)
                    }}
                  >
                    Confirm Demo Selection
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedProvider && (
          <section className="rounded-2xl border border-[#c7f36a]/25 bg-[#11170e] p-4 sm:p-5" role="status">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bddf82]">DEMO SELECTION CONFIRMED</p>
                <p className="mt-1.5 break-words text-[12px] font-semibold text-slate-100">{selectedProvider.displayName}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatINR(selectedProvider.proposedBudget)} proposed price · fictional demo profile, no provider contacted
                </p>
              </div>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
                type="button"
                onClick={continueToNegotiation}
              >
                Continue to Negotiation Preview <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        <p className="text-center text-[9px] leading-4 text-slate-600">
          Sample profile details, prices, experience, portfolios, and scores are fictional and illustrative only.
        </p>
      </motion.main>
    </div>
  )
}

export default ProviderMatching
