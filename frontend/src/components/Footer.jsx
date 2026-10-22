import { ArrowUpRight } from 'lucide-react'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner page-width">
        <div className="footer-brand-block">
          <a className="brand" href="#top" aria-label="DealFlow AI home">
            <span className="brand-mark" aria-hidden="true">D</span>
            <span>DealFlow <span className="brand-light">AI</span></span>
          </a>
          <p>From business intent to completed deal.</p>
        </div>
        <div className="footer-meta">
          <p>AI Matching <span>·</span> AI Negotiation <span>·</span> Smart Agreements <span>·</span> PayPal</p>
          <a href="#top" aria-label="Back to top">Back to top <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} DealFlow AI</span>
          <span>Built for better business outcomes.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
