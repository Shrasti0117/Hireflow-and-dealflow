import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, FolderPlus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function ProjectCard() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className="flex min-h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#101411] px-5 py-8 text-center sm:min-h-[300px] sm:px-8"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.12 }}
    >
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-[#c7f36a]/15 bg-[#c7f36a]/[0.055] text-[#c7f36a]">
        <FolderPlus size={23} strokeWidth={1.6} aria-hidden="true" />
        <Sparkles className="absolute -right-1 -top-1 text-[#d7ef9e]" size={14} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-base font-semibold tracking-[-0.03em] text-slate-100">No projects yet</h3>
      <p className="mt-2 text-[11px] text-slate-400">Your first deal starts with a project.</p>
      <p className="mt-1 max-w-[340px] text-[10px] leading-5 text-slate-500">
        Describe what you need and let DealFlow AI help you find the right provider.
      </p>
      <Link
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c]"
        to="/project/new"
      >
        Create Your First Project <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </motion.section>
  )
}

export default ProjectCard
