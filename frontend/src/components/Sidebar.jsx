import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  FileCheck2,
  Files,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
  X,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const primaryNavigation = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard, available: true },
  { label: 'Projects', Icon: BriefcaseBusiness },
  { label: 'Proposals', Icon: Files },
  { label: 'Negotiations', Icon: UsersRound },
  { label: 'Agreements', Icon: FileCheck2 },
  { label: 'Payments', Icon: BadgeDollarSign },
]

function Brand() {
  return (
    <Link className="flex items-center gap-3 px-2" to="/" aria-label="DealFlow AI home">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#c7f36a]/35 bg-[#c7f36a]/[0.08] text-base font-bold tracking-[-0.08em] text-[#c7f36a]">
        D
      </span>
      <span className="text-sm font-semibold tracking-[-0.04em] text-slate-100">
        DealFlow <span className="font-normal text-slate-400">AI</span>
      </span>
    </Link>
  )
}

function NavigationItems({ onNavigate }) {
  return (
    <>
      <div className="space-y-1">
        {primaryNavigation.map(({ label, to, Icon, available }) => (
          available ? (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-3 rounded-lg px-3 text-[12px] transition-colors ${
                  isActive
                    ? 'border border-[#c7f36a]/15 bg-[#c7f36a]/[0.09] font-medium text-[#d8f2a9]'
                    : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`
              }
              key={label}
              to={to}
              onClick={onNavigate}
              end
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </NavLink>
          ) : (
            <button
              className="flex min-h-10 w-full cursor-not-allowed items-center gap-3 rounded-lg border border-transparent px-3 text-left text-[12px] text-slate-500 opacity-75"
              key={label}
              type="button"
              disabled
              title={`${label} will be available in a future step`}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
              <span className="ml-auto text-[8px] uppercase tracking-wide text-slate-600">Soon</span>
            </button>
          )
        ))}
      </div>

      <div className="my-5 border-t border-white/[0.08]" />

      <button
        className="flex min-h-10 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 text-left text-[12px] text-slate-500 opacity-75"
        type="button"
        disabled
        title="Settings will be available in a future step"
      >
        <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
        Settings
      </button>
      <Link
        className="mt-1 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[12px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100"
        to="/"
        onClick={onNavigate}
      >
        <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />
        Logout
      </Link>
    </>
  )
}

function Sidebar({ open, onClose }) {
  const reduceMotion = useReducedMotion()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-white/[0.07] bg-[#0b0e0c] px-4 py-6 md:flex lg:w-64">
        <Brand />
        <nav className="mt-10 flex-1" aria-label="Dashboard navigation">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            Workspace
          </p>
          <NavigationItems />
        </nav>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#1b211a] text-xs font-semibold text-[#d8e8be]">C</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-slate-200">Client</span>
              <span className="block text-[9px] text-slate-500">Client workspace</span>
            </span>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] md:hidden"
              type="button"
              aria-label="Close navigation menu"
              onClick={onClose}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(82vw,280px)] flex-col border-r border-white/10 bg-[#0b0e0c] px-4 py-6 shadow-2xl md:hidden"
              aria-label="Mobile dashboard navigation"
              initial={reduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.04]"
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={onClose}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-10 flex-1" aria-label="Dashboard navigation">
                <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Workspace
                </p>
                <NavigationItems onNavigate={onClose} />
              </nav>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#1b211a] text-xs font-semibold text-[#d8e8be]">C</span>
                  <span>
                    <span className="block text-[11px] font-medium text-slate-200">Client</span>
                    <span className="block text-[9px] text-slate-500">Client workspace</span>
                  </span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
