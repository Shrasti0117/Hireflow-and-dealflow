import { Route, Routes } from 'react-router-dom'
import ClientDashboard from './pages/ClientDashboard.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ClientDashboard />} />
      {/* Reserve the next-step URL without implementing its page yet. */}
      <Route path="/project/new" element={null} />
    </Routes>
  )
}

export default App
