import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import AuthField from '../components/AuthField.jsx'
import AuthLayout from '../components/AuthLayout.jsx'

const initialForm = { email: '', password: '', remember: false }

function Login() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [resetMessage, setResetMessage] = useState('')
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()

  const updateField = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setResetMessage('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const email = form.email.trim()

    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      // This is demo-only navigation; real authentication will be connected in the backend phase.
      navigate('/dashboard')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to your DealFlow workspace."
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[10px] text-[#a4aba1]">
            <input
              className="h-3.5 w-3.5 cursor-pointer accent-[#c7f36a]"
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={updateField}
            />
            Remember me
          </label>
          <button
            className="text-[10px] text-[#c7f36a] transition-colors hover:text-[#ddffa0]"
            type="button"
            onClick={() => setResetMessage('Password recovery will be available in a later phase.')}
          >
            Forgot password?
          </button>
        </div>

        {resetMessage && (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-[#aab1a6]" role="status">
            {resetMessage}
          </p>
        )}

        <motion.button
          className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#c7f36a] px-4 text-[12px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] focus-visible:outline-[#c7f36a]"
          type="submit"
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          Sign In
        </motion.button>

      </form>

      <p className="mt-6 text-center text-[11px] text-[#969d94]">
        Don&apos;t have an account?{' '}
        <Link className="font-medium text-[#c7f36a] hover:text-[#ddffa0]" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
