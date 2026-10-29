import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, Circle, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProjectForm from '../components/ProjectForm.jsx'
import RequirementAnalysis from '../components/RequirementAnalysis.jsx'

const initialForm = {
  title: '',
  description: '',
  category: '',
  budget: '',
  timeline: '',
  skills: [],
}

const steps = ['Project Details', 'AI Analysis', 'Provider Matching']

function validateForm(form) {
  const errors = {}
  const title = form.title.trim()
  const descriptionLength = form.description.trim().length
  const budget = Number(form.budget)

  if (!title) errors.title = 'Project title is required.'
  if (descriptionLength < 30) errors.description = 'Description must be at least 30 characters.'
  if (!form.category) errors.category = 'Select a project category.'
  if (!form.budget || !Number.isFinite(budget) || budget < 1000 || budget > 10000000) {
    errors.budget = 'Enter a budget from ₹1,000 to ₹10,000,000.'
  }
  if (!form.timeline) errors.timeline = 'Select a desired timeline.'
  if (form.skills.length === 0) errors.skills = 'Add at least one required skill.'

  return errors
}

function CreateProject() {
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => location.state?.projectForm ?? initialForm)
  const [errors, setErrors] = useState({})
  const [currentView, setCurrentView] = useState('form')
  const reduceMotion = useReducedMotion()
  const activeStep = currentView === 'analysis' ? 1 : 0

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const addSkill = (skill) => {
    const normalizedSkill = skill.trim().replace(/,+$/, '').trim()
    if (!normalizedSkill || form.skills.some((existing) => existing.toLowerCase() === normalizedSkill.toLowerCase())) {
      return false
    }
    setForm((current) => ({ ...current, skills: [...current.skills, normalizedSkill] }))
    setErrors((current) => ({ ...current, skills: '' }))
    return true
  }

  const removeSkill = (skillToRemove) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setCurrentView('analysis')
  }

  const continueToMatching = () => {
    navigate('/project/matching', { state: { project: form } })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0c0b] text-slate-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1080px] items-center px-4 sm:px-6 lg:px-8">
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-100"
            to="/dashboard"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <motion.main
        className="mx-auto w-full max-w-[900px] px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <div className="text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] text-[#c7f36a]">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c7f36a]">DEALFLOW AI · PROJECT SETUP</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-3xl">
            Tell us what you&apos;re building
          </h1>
          <p className="mx-auto mt-2 max-w-[580px] text-[11px] leading-5 text-slate-400 sm:text-xs">
            Describe your project. DealFlow AI will help turn your idea into a clear, actionable brief.
          </p>
        </div>

        <nav className="mx-auto mt-8 max-w-[650px]" aria-label="Project setup progress">
          <ol className="grid grid-cols-3">
            {steps.map((step, index) => {
              const isComplete = index < activeStep
              const isActive = index === activeStep
              const upcoming = index === 2
              const StepIcon = isComplete ? Check : Circle

              return (
                <li className="relative flex min-w-0 flex-col items-center text-center" key={step}>
                  {index < steps.length - 1 && (
                    <span
                      className={`absolute left-1/2 top-4 h-px w-full ${index < activeStep ? 'bg-[#c7f36a]/50' : 'bg-white/10'}`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border ${
                      isActive
                        ? 'border-[#c7f36a]/40 bg-[#c7f36a]/[0.1] text-[#c7f36a]'
                        : isComplete
                          ? 'border-[#c7f36a]/30 bg-[#c7f36a]/[0.08] text-[#c7f36a]'
                          : 'border-white/10 bg-[#0a0c0b] text-slate-600'
                    }`}
                  >
                    {upcoming ? <span className="text-[10px]">3</span> : <StepIcon size={14} aria-hidden="true" />}
                  </span>
                  <span className={`mt-2 max-w-full truncate text-[9px] sm:text-[10px] ${isActive ? 'font-medium text-slate-100' : upcoming ? 'text-slate-600' : 'text-slate-400'}`}>
                    {step}
                    {upcoming && <span className="hidden sm:inline"> · Upcoming</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        <section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#101411] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] sm:mt-9 sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {currentView === 'form' ? (
              <motion.div
                key="project-form"
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-100">Project details</h2>
                  <p className="mt-1 text-[10px] leading-5 text-slate-500">Share the essentials to create a reviewable project brief.</p>
                </div>
                <ProjectForm
                  form={form}
                  errors={errors}
                  onChange={updateForm}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                  onSubmit={handleSubmit}
                />
              </motion.div>
            ) : (
              <motion.div
                key="requirement-analysis"
                initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                <RequirementAnalysis
                  form={form}
                  onEdit={() => {
                    setCurrentView('form')
                  }}
                  onContinue={continueToMatching}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <p className="mt-5 text-center text-[9px] leading-4 text-slate-600">
          Project information stays in this page for this demo. Real AI analysis and backend persistence will be added later.
        </p>
      </motion.main>
    </div>
  )
}

export default CreateProject
