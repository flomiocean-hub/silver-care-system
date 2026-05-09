import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuditProvider } from './contexts/AuditContext'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Members from './pages/Members'
import Courses from './pages/Courses'
import Finance from './pages/Finance'
import AIInsights from './pages/AIInsights'
import CourseRegister from './pages/CourseRegister'
import AuditLog from './pages/AuditLog'
import StaffManagement from './pages/StaffManagement'
import CareStations from './pages/CareStations'

function AdminOnly({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

function AdminShell() {
  const { user } = useAuth()
  if (!user) return <Login />

  return (
    <AuditProvider>
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/checkin"     element={<CheckIn />} />
              <Route path="/members"     element={<Members />} />
              <Route path="/courses"     element={<Courses />} />
              <Route path="/finance"     element={<Finance />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/logs"        element={<AuditLog />} />
              <Route path="/staff"         element={<AdminOnly><StaffManagement /></AdminOnly>} />
              <Route path="/care-stations" element={<AdminOnly><CareStations /></AdminOnly>} />
            </Routes>
          </main>
        </div>
        <BottomNav />
      </div>
    </AuditProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* 公開報名頁：不需登入 */}
          <Route path="/register/:courseId" element={<CourseRegister />} />
          {/* 管理後台：需登入 */}
          <Route path="/*" element={<AdminShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
