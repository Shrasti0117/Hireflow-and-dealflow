import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function AuthLayout({ title, description, children }) {
  const reduceMotion = useReducedMotion()

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0c0b] px-4 py-10 text-[#f0f1ec] sm:px-6 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 50% 15%, rgba(199,243,106,0.08), transparent 42%), radial-gradient(ellipse at 10% 85%, rgba(173,206,105,0.035), transparent 32%)',
        }}
      />
      <motion.section
        className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#111512]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-9"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 text-center">
          <Link
            className="mx-auto inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.035em]"
            to="/"
            aria-label="DealFlow AI home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#c7f36a]/45 bg-[#c7f36a]/[0.08] text-sm font-bold tracking-[-0.08em] text-[#c7f36a]">
              D
            </span>
            <span>DealFlow <span className="font-normal text-[#9da39c]">AI</span></span>
          </Link>
          <h1 className="mt-7 text-[26px] font-medium leading-tight tracking-[-0.055em] text-[#f0f1ec] sm:text-[29px]">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-6 text-[#969d94]">
            {description}
          </p>
        </div>

        {children}

        <Link
          className="mx-auto mt-7 inline-flex items-center gap-2 text-[11px] text-[#9ba298] transition-colors hover:text-[#e8ece4]"
          to="/"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to DealFlow AI
          <ArrowUpRight className="ml-0.5 opacity-50" size={12} aria-hidden="true" />
        </Link>
      </motion.section>
    </main>
  )
}

export default AuthLayout
