import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthField from '../components/AuthField.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import { getApiErrorMessage } from '../api/apiClient.js'
import { useAuth } from '../context/AuthContext.jsx'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    const email = form.email.trim()

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    setErrors(nextErrors)
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await register(form.fullName.trim(), email, form.password)
      const from = location.state?.from
      const path = typeof from === 'string'
        ? from
        : from && typeof from.pathname === 'string'
          ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
          : '/dashboard'
      navigate(path.startsWith('/') && !path.startsWith('//') ? path : '/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Account registration failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
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

        <motion.button
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#c7f36a] px-4 text-[12px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] focus-visible:outline-[#c7f36a]"
          type="submit"
          disabled={isSubmitting}
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          {isSubmitting ? 'Creating Account…' : 'Create Account'}
        </motion.button>

        {submitError && (
          <p className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2.5 text-center text-[10px] leading-5 text-rose-200" role="alert">
            {submitError}
          </p>
        )}

      </form>

      <p className="mt-5 text-center text-[11px] text-[#969d94]">
        Already have an account?{' '}
        <Link className="font-medium text-[#c7f36a] hover:text-[#ddffa0]" to="/login" state={location.state}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register
