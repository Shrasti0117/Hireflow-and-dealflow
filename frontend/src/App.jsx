import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ClientDashboard from './pages/ClientDashboard.jsx'
import CreateProject from './pages/CreateProject.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import ProviderMatching from './pages/ProviderMatching.jsx'
import Register from './pages/Register.jsx'

const NegotiationPreview = lazy(() => import('./pages/NegotiationPreview.jsx'))
const AgreementPreview = lazy(() => import('./pages/AgreementPreview.jsx'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ClientDashboard />} />
      <Route path="/project/new" element={<CreateProject />} />
      <Route path="/project/matching" element={<ProviderMatching />} />
      <Route path="/project/negotiation" element={
        <Suspense fallback={<main className="min-h-screen bg-[#0a0c0b]" aria-busy="true" />}>
          <NegotiationPreview />
        </Suspense>
      } />
      <Route path="/project/agreement" element={
        <Suspense fallback={<main className="min-h-screen bg-[#0a0c0b]" aria-busy="true" />}>
          <AgreementPreview />
        </Suspense>
      } />
    </Routes>
  )
}

export default App
