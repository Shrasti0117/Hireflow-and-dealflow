import { Bell, Menu } from 'lucide-react'

function DashboardHeader({ onMenuClick }) {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-white/[0.07] px-4 sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/[0.05] md:hidden"
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-[-0.025em] text-slate-100 sm:text-base">
            Welcome back, Client <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 hidden text-[10px] text-slate-500 sm:block sm:text-[11px]">
            Turn your next project into a completed deal.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-slate-400" aria-label="Notifications: no new activity">
          <Bell size={17} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-xs font-semibold text-[#d7eeab]" aria-label="Client profile">
          C
        </span>
      </div>
    </header>
  )
}

export default DashboardHeader
