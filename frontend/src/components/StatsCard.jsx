import { motion, useReducedMotion } from 'framer-motion'

function StatsCard({ title, value, description, Icon, index = 0 }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      className="rounded-xl border border-white/[0.08] bg-[#101411] p-4 transition-colors hover:border-white/[0.14] sm:p-5"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : index * 0.06 }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.16 } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-medium text-slate-400 sm:text-[11px]">{title}</h2>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-slate-100">{value}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#c7f36a]/12 bg-[#c7f36a]/[0.055] text-[#bddf82]">
          <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[9px] leading-4 text-slate-500 sm:text-[10px]">{description}</p>
    </motion.article>
  )
}

export default StatsCard
