import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  BadgeCheck,
  FileCheck2,
  SearchCheck,
  WalletCards,
} from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Describe Your Project',
    description: 'Tell DealFlow AI what you need using natural language.',
    Icon: ArrowDownLeft,
  },
  {
    number: '02',
    title: 'AI Finds the Right Match',
    description: 'AI analyzes skills, budget, timeline and project requirements.',
    Icon: SearchCheck,
  },
  {
    number: '03',
    title: 'Compare Proposals',
    description: 'Compare providers using transparent AI-powered deal scores.',
    Icon: BadgeCheck,
  },
  {
    number: '04',
    title: 'Negotiate with AI',
    description: 'AI helps both sides find a reasonable price, timeline and milestones.',
    Icon: ArrowLeftRight,
  },
  {
    number: '05',
    title: 'Create the Agreement',
    description: 'Turn the final negotiated terms into a structured agreement.',
    Icon: FileCheck2,
  },
  {
    number: '06',
    title: 'Pay with PayPal',
    description: 'Complete the transaction through PayPal.',
    Icon: WalletCards,
  },
]

function HowItWorks() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="section how-section" id="how-it-works">
      <div className="page-width">
        <motion.div
          className="section-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <span className="section-kicker"><span>01</span> THE PROCESS</span>
          <div className="section-heading-row">
            <h2>One workflow from<br /><span>intent to transaction.</span></h2>
            <p>Move from a clear project brief to a confident agreement, with every step connected.</p>
          </div>
        </motion.div>

        <div className="steps-grid">
          {steps.map(({ number, title, description, Icon }, index) => (
            <motion.article
              className="step-card"
              key={number}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.06 }}
            >
              <div className="step-card-top">
                <span className="step-number">{number}</span>
                <span className="step-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="step-card-line" aria-hidden="true" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
