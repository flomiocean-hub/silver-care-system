import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Users, BookOpen, DollarSign, Brain, History, ShieldCheck, Building2, CalendarDays, Archive } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: '首頁儀表板',   adminOnly: false, superAdminOnly: false },
  { to: '/checkin',        icon: UserCheck,       label: '數位簽到',     adminOnly: false, superAdminOnly: false },
  { to: '/members',        icon: Users,           label: '長者管理',     adminOnly: false, superAdminOnly: false },
  { to: '/courses',        icon: BookOpen,        label: '課程管理',     adminOnly: false, superAdminOnly: false },
  { to: '/schedule',        icon: CalendarDays,    label: '課程月曆',     adminOnly: false, superAdminOnly: false },
  { to: '/expired-courses', icon: Archive,         label: '過期課程',     adminOnly: false, superAdminOnly: false },
  { to: '/finance',         icon: DollarSign,      label: '財務追蹤',     adminOnly: false, superAdminOnly: false },
  { to: '/ai-insights',    icon: Brain,           label: 'AI 關懷洞察', adminOnly: false, superAdminOnly: false },
  { to: '/logs',           icon: History,         label: '操作記錄',     adminOnly: false, superAdminOnly: false },
  { to: '/care-stations',  icon: Building2,       label: '關懷站資訊',   adminOnly: false, superAdminOnly: true  },
  { to: '/staff',          icon: ShieldCheck,     label: '帳號管理',     adminOnly: true,  superAdminOnly: false },
]

export default function Sidebar() {
  const { isAdmin, isSuperAdmin } = useAuth()

  return (
    <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col py-6 gap-1 shrink-0">
      {NAV_ITEMS.filter(item => {
        if (item.superAdminOnly) return isSuperAdmin
        if (item.adminOnly)      return isAdmin
        return true
      }).map(({ to, icon: Icon, label }) => (
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
