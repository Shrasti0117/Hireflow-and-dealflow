import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CheckCheck,
  Files,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
  const reduceMotion = useReducedMotion()

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
            {stats.map((stat, index) => (
              <StatsCard key={stat.title} {...stat} index={index} />
            ))}
          </section>

          <section className="mt-8" aria-labelledby="projects-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-slate-100" id="projects-heading">
                  Your projects
                </h2>
                <p className="mt-1 text-[10px] text-slate-500">A clear view of every deal in motion.</p>
              </div>
            </div>
            <ProjectCard />
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
            Dashboard counts are an initial empty state and will update when project features are connected.
          </p>
        </motion.main>
      </div>
    </div>
  )
}

export default ClientDashboard
