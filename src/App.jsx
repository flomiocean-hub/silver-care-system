import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Members from './pages/Members'
import Courses from './pages/Courses'
import Finance from './pages/Finance'
import AIInsights from './pages/AIInsights'
import CourseRegister from './pages/CourseRegister'

export default function App() {
  return (
    <BrowserRouter basename="/silver-care-system">
      <Routes>
        {/* 報名頁：獨立全螢幕，無 Navbar/Sidebar */}
        <Route path="/register/:courseId" element={<CourseRegister />} />

        {/* 管理後台 */}
        <Route path="/*" element={
          <div className="min-h-screen bg-surface flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
              {/* 桌機側邊欄（md以上顯示） */}
              <Sidebar />
              {/* 主要內容：手機加底部 padding 避免被 BottomNav 遮住 */}
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
            {/* 手機底部導覽（md以下顯示） */}
            <BottomNav />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
