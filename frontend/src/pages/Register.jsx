import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BriefcaseBusiness, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthField from '../components/AuthField.jsx'
import AuthLayout from '../components/AuthLayout.jsx'

const roles = [
  {
    value: 'CLIENT',
    title: 'Hire a Provider',
    description: 'I need someone to complete a project.',
    Icon: BriefcaseBusiness,
  },
  {
    value: 'PROVIDER',
    title: 'Offer My Services',
    description: 'I provide services and want to work on projects.',
    Icon: UserRound,
  },
]

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'CLIENT',
}

function Register() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const reduceMotion = useReducedMotion()

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setMessage('')
  }

  const selectRole = (role) => {
    setForm((current) => ({ ...current, role }))
    setErrors((current) => ({ ...current, role: '' }))
    setMessage('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const email = form.email.trim()

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) nextErrors.password = 'Password is required.'
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    if (!form.role) nextErrors.role = 'Choose how you want to use DealFlow.'

    setErrors(nextErrors)
    setMessage('')
    if (Object.keys(nextErrors).length === 0) {
      setMessage('Authentication will be connected in the backend phase.')
    }
  }

  return (
    <AuthLayout
      title="Create your DealFlow account"
      description="Start turning project requirements into completed deals."
    >
      <form className="space-y-3.5" noValidate onSubmit={handleSubmit}>
        <AuthField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={updateField}
          autoComplete="name"
          placeholder="Your full name"
          error={errors.fullName}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          placeholder="Create a password"
          error={errors.password}
        />
        <AuthField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={updateField}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <fieldset className="min-w-0 border-0 p-0 pt-1">
          <legend className="mb-2.5 text-[11px] font-medium text-[#d9ded5]">
            I want to:
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Account role">
            {roles.map(({ value, title, description, Icon }) => {
              const selected = form.role === value
              return (
                <motion.button
                  className={`flex min-h-[78px] w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-[#c7f36a]/45 bg-[#c7f36a]/[0.07]'
                      : 'border-white/10 bg-[#0b0e0c] hover:border-white/20'
                  }`}
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectRole(value)}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                    selected ? 'bg-[#c7f36a]/10 text-[#c7f36a]' : 'bg-white/[0.04] text-[#9ba298]'
                  }`}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium leading-4 text-[#e5e9e1]">{title}</span>
                    <span className="mt-1 block text-[9px] leading-4 text-[#929990]">{description}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
          {errors.role && (
            <p className="mt-1.5 text-[10px] text-rose-300" role="alert">{errors.role}</p>
          )}
        </fieldset>

        <motion.button
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#c7f36a] px-4 text-[12px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] focus-visible:outline-[#c7f36a]"
          type="submit"
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          Create Account
        </motion.button>

        {message && (
          <p className="rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] px-3 py-2.5 text-center text-[10px] leading-5 text-[#d2e9aa]" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="mt-5 text-center text-[11px] text-[#969d94]">
        Already have an account?{' '}
        <Link className="font-medium text-[#c7f36a] hover:text-[#ddffa0]" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register
