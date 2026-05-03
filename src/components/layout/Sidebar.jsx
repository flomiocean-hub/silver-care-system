import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Users, BookOpen, DollarSign, Brain } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首頁儀表板' },
  { to: '/checkin', icon: UserCheck, label: '數位簽到' },
  { to: '/members', icon: Users, label: '長者管理' },
  { to: '/courses', icon: BookOpen, label: '課程管理' },
  { to: '/finance', icon: DollarSign, label: '財務追蹤' },
  { to: '/ai-insights', icon: Brain, label: 'AI 關懷洞察' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 gap-1 shrink-0">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-r-full mr-2 transition-all ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-green-50 hover:text-primary'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
