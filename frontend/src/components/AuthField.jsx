import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function AuthField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  error,
}) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[#d9ded5]" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          className={`h-11 w-full rounded-lg border bg-[#0b0e0c] px-3.5 text-[12px] text-[#eff1ec] outline-none transition placeholder:text-[#626a61] focus:border-[#c7f36a]/50 focus:ring-2 focus:ring-[#c7f36a]/10 ${
            error ? 'border-rose-400/50' : 'border-white/10'
          } ${isPassword ? 'pr-11' : ''}`}
          id={inputId}
          name={name}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword && (
          <button
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[#858d83] transition-colors hover:text-[#e7ebe3]"
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[10px] leading-4 text-rose-300" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default AuthField
