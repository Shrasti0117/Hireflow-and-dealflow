import Features from '../components/Features.jsx'
import Footer from '../components/Footer.jsx'
import Hero from '../components/Hero.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import Navbar from '../components/Navbar.jsx'

function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  )
}

export default Landing
