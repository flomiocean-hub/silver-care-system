import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Users, BookOpen, DollarSign, Brain } from 'lucide-react'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: '儀表板' },
  { to: '/checkin',    icon: UserCheck,       label: '簽到' },
  { to: '/members',    icon: Users,           label: '長者' },
  { to: '/courses',    icon: BookOpen,        label: '課程' },
  { to: '/finance',    icon: DollarSign,      label: '財務' },
  { to: '/ai-insights',icon: Brain,           label: 'AI' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-green-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
