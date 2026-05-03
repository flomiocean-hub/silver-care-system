import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Members from './pages/Members'
import Courses from './pages/Courses'
import Finance from './pages/Finance'
import AIInsights from './pages/AIInsights'

export default function App() {
  return (
    <BrowserRouter basename="/silver-care-system">
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/members" element={<Members />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/ai-insights" element={<AIInsights />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
