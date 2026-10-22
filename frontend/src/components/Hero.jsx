import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleDollarSign,
  FileText,
  MoveUpRight,
  Sparkles,
} from 'lucide-react'

const workflow = ['Describe', 'Match', 'Compare', 'Negotiate', 'Agree', 'Pay']

function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="hero-section" id="top">
      <div className="hero-grid page-width">
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eyebrow"><span className="live-dot" /> AI-powered project commerce</div>
          <h1>From business intent <span>to completed deal.</span></h1>
          <p className="hero-description">
            Tell us what you need. DealFlow AI finds the right provider, helps both sides
            negotiate a fair deal, creates the agreement, and completes the transaction
            through PayPal.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#how-it-works">
              Start a Project <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="button button-quiet" href="#product-preview">
              Explore Demo <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="hero-proof">
            <span className="proof-icon"><BadgeCheck size={16} aria-hidden="true" /></span>
            <span>From first brief to a clear, agreed next step.</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          id="product-preview"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="preview-topline">
            <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
            <span>DEALFLOW WORKSPACE</span>
            <span className="preview-status"><span /> In progress</span>
          </div>
          <div className="preview-content">
            <div className="preview-heading">
              <span className="preview-kicker">PROJECT OVERVIEW</span>
              <button type="button" className="icon-button" aria-label="More project options">
                <MoveUpRight size={16} aria-hidden="true" />
              </button>
            </div>
            <h2>Build a customer insights dashboard</h2>
            <p className="preview-subtitle">A project brief, transformed into a deal.</p>

            <div className="brief-card">
              <div className="brief-icon"><FileText size={17} aria-hidden="true" /></div>
              <div>
                <span className="brief-label">YOUR BRIEF</span>
                <p>“Help us turn product data into decisions our team can act on.”</p>
              </div>
              <span className="brief-check"><BadgeCheck size={16} aria-hidden="true" /></span>
            </div>

            <div className="preview-divider"><span>DEALFLOW AI</span><span /></div>

            <div className="deal-row">
              <div className="provider-avatar" aria-hidden="true">JM</div>
              <div className="provider-copy">
                <strong>Jordan M.</strong>
                <span>Product analytics · Verified</span>
              </div>
              <span className="match-score"><Sparkles size={12} aria-hidden="true" /> 96%</span>
            </div>

            <div className="terms-grid">
              <div><span>PROJECT BUDGET</span><strong><CircleDollarSign size={15} aria-hidden="true" /> $4,800</strong></div>
              <div><span>EST. TIMELINE</span><strong>4 weeks <ChevronRight size={14} aria-hidden="true" /></strong></div>
            </div>

            <div className="agreement-bar">
              <div className="agreement-icon"><BadgeCheck size={17} aria-hidden="true" /></div>
              <div><strong>Clear terms. Shared confidence.</strong><span>Ready for both sides to review</span></div>
              <ArrowRight size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="floating-note">
            <span className="floating-note-icon"><Sparkles size={14} aria-hidden="true" /></span>
            <span><strong>Intent understood</strong><small>Requirements organized</small></span>
          </div>
        </motion.div>
      </div>

      <div className="workflow-wrap page-width">
        <div className="workflow-label">ONE CONNECTED WORKFLOW</div>
        <div className="workflow-list" aria-label="DealFlow workflow">
          {workflow.map((step, index) => (
            <div className="workflow-item" key={step}>
              <span className={index === 0 ? 'workflow-step workflow-active' : 'workflow-step'}>
                {step}
              </span>
              {index < workflow.length - 1 && <span className="workflow-arrow"><ArrowRight size={13} aria-hidden="true" /></span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
