import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  Clock3,
  Files,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient, { getApiErrorMessage } from '../api/apiClient.js'
import DashboardHeader from '../components/DashboardHeader.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import Sidebar from '../components/Sidebar.jsx'
import StatsCard from '../components/StatsCard.jsx'

const stats = [
  {
    title: 'Active Projects',
    value: '0',
    description: 'No projects started yet',
    Icon: BriefcaseBusiness,
  },
  {
    title: 'Proposals Received',
    value: '0',
    description: 'Waiting for your first project',
    Icon: Files,
  },
  {
    title: 'Active Negotiations',
    value: '0',
    description: 'No active negotiations',
    Icon: MessageSquareText,
  },
  {
    title: 'Completed Deals',
    value: '0',
    description: 'Your first deal is ahead',
    Icon: BadgeDollarSign,
  },
]

function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const reduceMotion = useReducedMotion()

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true)
    setProjectsError('')

    try {
      const { data } = await apiClient.get('/projects')
      if (!Array.isArray(data?.data)) {
        throw new Error('The API returned an unexpected projects response.')
      }
      setProjects(data.data)
    } catch (error) {
      setProjectsError(getApiErrorMessage(error, error.message || 'Projects could not be loaded. Please try again.'))
    } finally {
      setIsLoadingProjects(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

  const projectStats = stats.map((stat, index) => index === 0
    ? {
      ...stat,
      value: isLoadingProjects ? '…' : projectsError ? '—' : String(projects.length),
      description: isLoadingProjects
        ? 'Loading saved projects'
        : projectsError
          ? 'Project count unavailable'
          : projects.length === 1
            ? '1 project currently saved'
            : `${projects.length} projects currently saved`,
    }
    : stat)

  return (
    <div className="min-h-screen bg-[#0a0c0b] text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen md:ml-56 lg:ml-64">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <motion.main
          className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-10"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        >
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#c7f36a]">
                CLIENT WORKSPACE
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-[30px]">
                Your dashboard
              </h2>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-400 sm:text-xs">
                Your path from project intent to a completed deal starts here.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[11px] font-semibold text-[#171b12] shadow-[0_5px_24px_rgba(199,243,106,0.08)] transition-colors hover:bg-[#d4ff7c] sm:w-auto"
              to="/project/new"
            >
              <span className="text-base leading-none" aria-hidden="true">+</span>
              Create New Project
            </Link>
          </section>

          <section className="mt-7 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
            {projectStats.map((stat, index) => (
              <StatsCard key={stat.title} {...stat} index={index} />
            ))}
          </section>

          <section className="mt-8" aria-labelledby="projects-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-slate-100" id="projects-heading">
                  Saved projects
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">Projects are currently shared across this database until account access is implemented.</p>
              </div>
            </div>
            {isLoadingProjects ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/[0.08] bg-[#101411] px-5 text-center text-[11px] text-slate-400" role="status" aria-busy="true">
                Loading your saved projects…
              </div>
            ) : projectsError ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-400/20 bg-[#101411] px-5 py-8 text-center">
                <p className="max-w-xl text-[11px] leading-5 text-rose-200" role="alert">{projectsError}</p>
                <button
                  className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-3 text-[10px] font-medium text-slate-200 transition-colors hover:bg-white/[0.05]"
                  type="button"
                  onClick={loadProjects}
                >
                  Try Again
                </button>
              </div>
            ) : projects.length === 0 ? (
              <ProjectCard />
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-label="Saved projects">
                {projects.map((project) => (
                  <article className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#101411] p-4 sm:p-5" key={project._id}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-slate-100">{project.title}</h3>
                        <p className="mt-1 text-[10px] text-[#c7f36a]">{project.category}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-400">
                        <CalendarDays size={11} aria-hidden="true" />
                        {project.createdAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(project.createdAt)) : 'Saved project'}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-400">{project.description}</p>
                    <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-white/[0.07] pt-3 min-[430px]:grid-cols-2">
                      <div>
                        <dt className="text-[9px] text-slate-500">Estimated budget</dt>
                        <dd className="mt-1 text-[10px] text-slate-200">{formatINR(Number(project.budget))}</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] text-slate-500">Desired timeline</dt>
                        <dd className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-slate-200">
                          <Clock3 size={11} aria-hidden="true" /> {project.timeline}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Required skills">
                      {project.skills.map((skill) => (
                        <span className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-300" key={skill}>{skill}</span>
                      ))}
                    </div>
                    <p className="mt-3 break-all border-t border-white/[0.07] pt-3 font-mono text-[8px] text-slate-600">Project ID: {project._id}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.article
              className="relative overflow-hidden rounded-2xl border border-[#c7f36a]/15 bg-[#101511] p-5 sm:p-6"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.15 }}
            >
              <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#c7f36a]/[0.035] blur-3xl" aria-hidden="true" />
              <div className="relative flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-[#c7f36a]">
                  <Sparkles size={19} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#bddc8d]">DEALFLOW AI</p>
                  <h2 className="mt-1.5 text-base font-semibold tracking-[-0.025em] text-slate-100">
                    Your AI Deal Assistant
                  </h2>
                  <p className="mt-2 max-w-[560px] text-[10px] leading-5 text-slate-400 sm:text-[11px]">
                    Describe your project in natural language and DealFlow AI will turn your idea into
                    structured requirements, find suitable providers, and help you move toward a completed deal.
                  </p>
                  <Link
                    className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#c7f36a]/25 bg-[#c7f36a]/[0.08] px-3 text-[10px] font-medium text-[#d8f2a9] transition-colors hover:bg-[#c7f36a]/[0.14]"
                    to="/project/new"
                  >
                    Create a Project <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.article>

            <motion.section
              className="rounded-2xl border border-white/[0.08] bg-[#101411] p-5 sm:p-6"
              aria-labelledby="activity-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.2 }}
            >
              <div className="flex items-center gap-2.5">
                <CheckCheck className="text-slate-500" size={16} aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-100" id="activity-heading">Recent Activity</h2>
              </div>
              <div className="flex min-h-[128px] flex-col items-center justify-center text-center">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-slate-500">
                  <BriefcaseBusiness size={16} aria-hidden="true" />
                </span>
                <p className="mt-3 text-[10px] font-medium text-slate-300">No recent activity</p>
                <p className="mt-1 max-w-[240px] text-[9px] leading-4 text-slate-500">
                  Your project activity will appear here once you start working with DealFlow AI.
                </p>
              </div>
            </motion.section>
          </section>

          <p className="mt-7 text-center text-[9px] text-slate-600">
            Project count and saved project details are loaded from the API. Other dashboard counts are not connected yet.
          </p>
        </motion.main>
      </div>
    </div>
  )
}

export default ClientDashboard
