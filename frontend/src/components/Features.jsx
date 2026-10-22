import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  FileCheck2,
  Handshake,
  SearchCheck,
  WalletCards,
} from 'lucide-react'

const features = [
  {
    title: 'AI Matching',
    description: 'Find providers based on project requirements instead of relying only on keyword searches.',
    Icon: SearchCheck,
    number: '01',
  },
  {
    title: 'AI Negotiation',
    description: 'Turn different budget and timeline expectations into structured deal suggestions.',
    Icon: Handshake,
    number: '02',
  },
  {
    title: 'Smart Agreements',
    description: 'Convert negotiated price, deliverables and milestones into a clear agreement.',
    Icon: FileCheck2,
    number: '03',
  },
  {
    title: 'PayPal Payments',
    description: 'Move from an approved agreement to a completed transaction through PayPal.',
    Icon: WalletCards,
    number: '04',
  },
]

function Features() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="section features-section" id="features">
      <div className="page-width">
        <motion.div
          className="features-intro"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <div>
            <span className="section-kicker"><span>02</span> BUILT FOR REAL DEALS</span>
            <h2>AI that moves beyond <span>recommendations.</span></h2>
          </div>
          <p>
            The AI doesn&apos;t stop at finding a provider. It helps move the relationship toward
            an actual agreement and transaction.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map(({ title, description, Icon, number }, index) => (
            <motion.article
              className="feature-card"
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.07 }}
              whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
            >
              <div className="feature-card-head">
                <span className="feature-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                <span className="feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowUpRight className="feature-arrow" size={17} aria-hidden="true" />
            </motion.article>
          ))}
        </div>

        <div className="closing-banner">
          <div>
            <span className="closing-kicker"><span /> FROM INTENT TO OUTCOME</span>
            <h3>Make the next business deal<br /><span>the clear one.</span></h3>
          </div>
          <a className="button button-primary" href="#how-it-works">
            See how it works <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default Features
