import { motion, useReducedMotion } from 'framer-motion'
import { BriefcaseBusiness, Clock3, IndianRupee, Layers3, UserRound } from 'lucide-react'

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount)

function ProviderCard({
  provider,
  score,
  matchingSkills,
  isCompared,
  comparisonLimitReached,
  isSelected,
  onCompareChange,
  onSelect,
}) {
  const reduceMotion = useReducedMotion()
  const compareId = `compare-${provider.id}`

  return (
    <motion.article
      className={`flex h-full flex-col rounded-2xl border bg-[#101411] p-4 transition-colors sm:p-5 ${
        isSelected
          ? 'border-[#c7f36a]/40 shadow-[0_0_0_1px_rgba(199,243,106,0.08)]'
          : isCompared
            ? 'border-[#c7f36a]/25'
            : 'border-white/[0.08] hover:border-white/[0.15]'
      }`}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-sm font-semibold text-[#d7eeab]" aria-hidden="true">
            {provider.initials}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-[13px] font-semibold text-slate-100">{provider.displayName}</h3>
            <p className="mt-1 break-words text-[10px] leading-4 text-slate-400">{provider.specialty}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
          Demo
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#c7f36a]/15 bg-[#c7f36a]/[0.045] px-3 py-2.5">
        <p className="text-[9px] text-slate-500">Demo match score</p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#d8f2a9]">
          {score === null ? 'Not enough information' : `${score}%`}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1.5 text-[9px] font-medium text-slate-500">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {provider.skills.map((skill) => (
              <span
                className={`rounded-md border px-2 py-1 text-[9px] ${
                  matchingSkills.some((match) => match.toLowerCase() === skill.toLowerCase())
                    ? 'border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-[#d8f2a9]'
                    : 'border-white/[0.08] bg-white/[0.025] text-slate-400'
                }`}
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Detail icon={BriefcaseBusiness} label="Experience">{provider.experienceYears} years <span className="text-slate-600">(illustrative)</span></Detail>
          <Detail icon={IndianRupee} label="Proposed budget">{formatINR(provider.proposedBudget)}</Detail>
          <Detail icon={Clock3} label="Delivery estimate">{provider.delivery}</Detail>
          <Detail icon={Layers3} label="Portfolio">{provider.portfolio}</Detail>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[9px] text-slate-500">
        <UserRound size={12} aria-hidden="true" /> {provider.profileStatus}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <label
          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-1 text-[10px] transition-colors ${
            comparisonLimitReached && !isCompared ? 'cursor-not-allowed text-slate-600' : 'text-slate-300 hover:text-white'
          }`}
          htmlFor={compareId}
          title={comparisonLimitReached && !isCompared ? 'You can compare up to three demo providers.' : undefined}
        >
          <input
            className="h-4 w-4 accent-[#c7f36a] focus-visible:outline-[#c7f36a]"
            checked={isCompared}
            disabled={comparisonLimitReached && !isCompared}
            id={compareId}
            onChange={(event) => onCompareChange(provider, event.target.checked)}
            type="checkbox"
          />
          Compare
        </label>
        <button
          className={`inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36a] ${
            isSelected
              ? 'border border-[#c7f36a]/25 bg-[#c7f36a]/[0.08] text-[#d8f2a9]'
              : 'bg-[#c7f36a] text-[#171b12] hover:bg-[#d4ff7c]'
          }`}
          type="button"
          onClick={() => onSelect(provider)}
        >
          {isSelected ? 'Selected (demo)' : 'Select Provider'}
        </button>
      </div>
    </motion.article>
  )
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[8px] text-slate-500">
        <Icon size={11} aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 break-words text-[10px] leading-4 text-slate-300">{children}</p>
    </div>
  )
}

export default ProviderCard
