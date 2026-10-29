import { ArrowLeft, ArrowRight, Check, ClipboardList, Clock3, IndianRupee, Layers3, Sparkles } from 'lucide-react'

// Demo templates only; real AI analysis and backend persistence will be added later.
const suggestionTemplates = {
  'Web Development': {
    deliverables: ['Responsive user interface', 'Backend and API integration', 'Testing and deployment preparation'],
    milestones: ['Scope and requirements review', 'Interface and core development', 'Testing, revisions, and handoff'],
  },
  'Mobile App Development': {
    deliverables: ['App screen design', 'Mobile app implementation', 'Testing and handoff preparation'],
    milestones: ['Scope and screen review', 'App implementation', 'Testing, revisions, and handoff'],
  },
  'AI / Machine Learning': {
    deliverables: ['Data preparation plan', 'Model prototype', 'Evaluation summary'],
    milestones: ['Scope and data review', 'Prototype preparation', 'Evaluation and handoff'],
  },
  'UI / UX Design': {
    deliverables: ['User flows', 'Wireframes', 'Interactive prototype'],
    milestones: ['Scope and user-flow review', 'Wireframe review', 'Prototype revisions and handoff'],
  },
  'Data Analytics': {
    deliverables: ['Data preparation plan', 'Analysis summary', 'Data visualizations'],
    milestones: ['Scope and data review', 'Analysis and visualization', 'Review and handoff'],
  },
  'Blockchain / Web3': {
    deliverables: ['Contract design outline', 'Smart contract implementation', 'Contract testing'],
    milestones: ['Scope and contract review', 'Implementation', 'Testing, revisions, and handoff'],
  },
  Other: {
    deliverables: ['Clarified project scope', 'Agreed project deliverables', 'Review and handoff materials'],
    milestones: ['Scope clarification', 'Prepare agreed deliverables', 'Review and handoff'],
  },
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-slate-400">
        <Icon size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <div className="mt-1 break-words text-[11px] leading-5 text-slate-200">{children}</div>
      </div>
    </div>
  )
}

function SuggestionList({ title, items }) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#0c100d] p-4 sm:p-5">
      <h3 className="text-[12px] font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">Provisional template suggestions — review and edit to fit your project.</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li className="flex gap-2.5 text-[11px] leading-5 text-slate-300" key={item}>
            <Check className="mt-1 shrink-0 text-[#bddf82]" size={14} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function RequirementAnalysis({ form, onEdit, onContinue }) {
  const templates = suggestionTemplates[form.category] ?? suggestionTemplates.Other
  const formattedBudget = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(form.budget))

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.055] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] text-[#c7f36a]">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[12px] font-semibold text-slate-100">Demo analysis — AI integration coming in a later step.</h2>
            <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
              This is a structured preview from your form details and category templates. No AI model analyzed this project.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-white/[0.08] bg-[#101411] p-4 sm:p-6" aria-labelledby="project-preview-title">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c7f36a]">PROJECT BRIEF</p>
        <h2 className="mt-2 break-words text-xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-2xl" id="project-preview-title">
          {form.title.trim()}
        </h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-[11px] leading-6 text-slate-300">{form.description.trim()}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
          <Detail icon={Layers3} label="Category">{form.category}</Detail>
          <Detail icon={IndianRupee} label="Estimated budget">{formattedBudget} <span className="text-slate-500">(estimate only, not a payment)</span></Detail>
          <Detail icon={Clock3} label="Desired timeline">{form.timeline}</Detail>
          <Detail icon={ClipboardList} label="Required skills">
            <div className="flex flex-wrap gap-1.5">
              {form.skills.map((skill) => (
                <span className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-[9px] text-slate-300" key={skill}>{skill}</span>
              ))}
            </div>
          </Detail>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SuggestionList title="Suggested deliverables" items={templates.deliverables} />
        <SuggestionList title="Suggested milestones" items={templates.milestones} />
      </div>

      <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[10px] leading-5 text-slate-400" role="note">
        Deliverables and milestones are provisional category templates for your review, not confirmed scope or guaranteed outputs.
      </p>

      <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.035] hover:text-white"
          type="button"
          onClick={onEdit}
        >
          <ArrowLeft size={14} aria-hidden="true" /> Edit Project Details
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c]"
          type="button"
          onClick={onContinue}
        >
          Continue to Provider Matching <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default RequirementAnalysis
