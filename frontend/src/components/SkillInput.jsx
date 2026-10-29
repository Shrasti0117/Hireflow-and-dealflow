import { useId, useState } from 'react'
import { Plus, X } from 'lucide-react'

function SkillInput({ skills, suggestions, onAdd, onRemove, error }) {
  const [skillDraft, setSkillDraft] = useState('')
  const inputId = useId()
  const errorId = `${inputId}-error`

  const addSkill = (skill = skillDraft) => {
    const added = onAdd(skill)
    if (added) setSkillDraft('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSkill()
    } else if (event.key === 'Backspace' && !skillDraft && skills.length > 0) {
      onRemove(skills[skills.length - 1])
    }
  }

  const availableSuggestions = suggestions.filter(
    (suggestion) => !skills.some((skill) => skill.toLowerCase() === suggestion.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-slate-200" htmlFor={inputId}>
        Required skills <span className="text-rose-300" aria-hidden="true">*</span>
      </label>
      <div
        className={`flex min-h-12 flex-wrap items-center gap-2 rounded-lg border bg-[#0b0e0c] p-2.5 transition focus-within:border-[#c7f36a]/50 focus-within:ring-2 focus-within:ring-[#c7f36a]/10 ${
          error ? 'border-rose-400/50' : 'border-white/10'
        }`}
      >
        {skills.map((skill) => (
          <span
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] py-1 pl-2.5 pr-1.5 text-[10px] text-[#d8f2a9]"
            key={skill}
          >
            <span className="break-all">{skill}</span>
            <button
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#b8cc91] transition-colors hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => onRemove(skill)}
              aria-label={`Remove ${skill}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-[11px] text-slate-100 outline-none placeholder:text-slate-600"
          id={inputId}
          type="text"
          value={skillDraft}
          onChange={(event) => setSkillDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length ? 'Add another skill' : 'Type a skill and press Enter'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-[10px] font-medium text-slate-300 transition-colors hover:border-[#c7f36a]/30 hover:text-[#d8f2a9]"
          type="button"
          onClick={() => addSkill()}
        >
          <Plus size={13} aria-hidden="true" />
          Add
        </button>
      </div>
      {error && (
        <p className="text-[10px] leading-4 text-rose-300" id={errorId} role="alert">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <p className="text-[10px] text-slate-500">Suggested for this category — select to add:</p>
        <div className="flex flex-wrap gap-1.5">
          {availableSuggestions.length > 0 ? availableSuggestions.map((suggestion) => (
            <button
              className="min-h-7 rounded-md border border-white/[0.08] px-2 text-[9px] text-slate-400 transition-colors hover:border-[#c7f36a]/25 hover:text-slate-100"
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
            >
              + {suggestion}
            </button>
          )) : (
            <span className="text-[10px] text-slate-600">All suggestions have been added.</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SkillInput
