import { useId } from 'react'
import { ArrowRight } from 'lucide-react'
import SkillInput from './SkillInput.jsx'

const categories = [
  'Web Development',
  'Mobile App Development',
  'AI / Machine Learning',
  'UI / UX Design',
  'Data Analytics',
  'Blockchain / Web3',
  'Other',
]

const timelines = ['1–2 weeks', '3–4 weeks', '1–2 months', '3+ months']

const skillsByCategory = {
  'Web Development': ['React', 'Node.js', 'MongoDB', 'Express'],
  'Mobile App Development': ['Flutter', 'React', 'UI/UX'],
  'AI / Machine Learning': ['Python', 'Machine Learning', 'Data Analysis'],
  'UI / UX Design': ['Figma', 'UI/UX', 'User Research'],
  'Data Analytics': ['SQL', 'Python', 'Data Analysis'],
  'Blockchain / Web3': ['Solidity', 'Smart Contracts', 'Web3'],
  Other: ['React', 'Python', 'Figma', 'SQL'],
}

const fieldClass = (error) =>
  `min-h-11 w-full rounded-lg border bg-[#0b0e0c] px-3.5 py-2.5 text-[11px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${
    error ? 'border-rose-400/50' : 'border-white/10'
  }`

function FieldError({ id, error }) {
  return error ? (
    <p className="text-[10px] leading-4 text-rose-300" id={id} role="alert">
      {error}
    </p>
  ) : null
}

function ProjectForm({ form, errors, onChange, onAddSkill, onRemoveSkill, onSubmit }) {
  const formId = useId()

  const labelClass = 'block text-[11px] font-medium text-slate-200'
  const requiredMark = <span className="text-rose-300" aria-hidden="true"> *</span>
  const suggestedSkills = skillsByCategory[form.category] ?? skillsByCategory.Other

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className={labelClass} htmlFor={`${formId}-title`}>Project title{requiredMark}</label>
        <input
          className={fieldClass(errors.title)}
          id={`${formId}-title`}
          name="title"
          type="text"
          value={form.title}
          onChange={onChange}
          placeholder="e.g. Build an e-commerce website"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${formId}-title-error` : undefined}
        />
        <FieldError id={`${formId}-title-error`} error={errors.title} />
      </div>

      <div className="space-y-2">
        <label className={labelClass} htmlFor={`${formId}-description`}>Project description{requiredMark}</label>
        <textarea
          className={`${fieldClass(errors.description)} min-h-36 resize-y leading-5`}
          id={`${formId}-description`}
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Describe the problem, what you want to build, the target users, and the outcome you expect..."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={`${formId}-description-help${errors.description ? ` ${formId}-description-error` : ''}`}
        />
        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
          <p className="text-slate-500" id={`${formId}-description-help`}>Minimum 30 characters.</p>
          <p className={form.description.trim().length < 30 ? 'text-slate-500' : 'text-[#bddf82]'} aria-live="polite">
            {form.description.length} characters
          </p>
        </div>
        <FieldError id={`${formId}-description-error`} error={errors.description} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClass} htmlFor={`${formId}-category`}>Project category{requiredMark}</label>
          <select
            className={fieldClass(errors.category)}
            id={`${formId}-category`}
            name="category"
            value={form.category}
            onChange={onChange}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? `${formId}-category-error` : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <FieldError id={`${formId}-category-error`} error={errors.category} />
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor={`${formId}-budget`}>Estimated budget{requiredMark}</label>
          <div className={`flex min-h-11 items-center rounded-lg border bg-[#0b0e0c] transition focus-within:border-[#c7f36a]/50 focus-within:ring-2 focus-within:ring-[#c7f36a]/10 ${errors.budget ? 'border-rose-400/50' : 'border-white/10'}`}>
            <span className="pl-3.5 text-[12px] text-slate-400" aria-hidden="true">₹</span>
            <input
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-[11px] text-slate-100 outline-none placeholder:text-slate-600"
              id={`${formId}-budget`}
              name="budget"
              type="number"
              min="1000"
              max="10000000"
              step="1"
              value={form.budget}
              onChange={onChange}
              placeholder="e.g. 50000"
              aria-label="Estimated budget in Indian rupees"
              aria-invalid={Boolean(errors.budget)}
              aria-describedby={`${formId}-budget-help${errors.budget ? ` ${formId}-budget-error` : ''}`}
            />
            <span className="pr-3.5 text-[10px] text-slate-500">INR</span>
          </div>
          <p className="text-[10px] leading-4 text-slate-500" id={`${formId}-budget-help`}>
            ₹1,000–₹10,000,000. Estimate only — this is not a payment.
          </p>
          <FieldError id={`${formId}-budget-error`} error={errors.budget} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass} htmlFor={`${formId}-timeline`}>Desired timeline{requiredMark}</label>
        <select
          className={fieldClass(errors.timeline)}
          id={`${formId}-timeline`}
          name="timeline"
          value={form.timeline}
          onChange={onChange}
          aria-invalid={Boolean(errors.timeline)}
          aria-describedby={errors.timeline ? `${formId}-timeline-error` : undefined}
        >
          <option value="">Select a timeline</option>
          {timelines.map((timeline) => <option key={timeline} value={timeline}>{timeline}</option>)}
        </select>
        <FieldError id={`${formId}-timeline-error`} error={errors.timeline} />
      </div>

      <SkillInput
        skills={form.skills}
        suggestions={suggestedSkills}
        onAdd={onAddSkill}
        onRemove={onRemoveSkill}
        error={errors.skills}
      />

      <div className="border-t border-white/[0.07] pt-5">
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[11px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] sm:w-auto"
          type="submit"
        >
          Review Demo Analysis <ArrowRight size={15} aria-hidden="true" />
        </button>
        <p className="mt-2 text-[10px] text-slate-500">
          No AI API is called. You can review these details before moving on.
        </p>
      </div>
    </form>
  )
}

export default ProjectForm
