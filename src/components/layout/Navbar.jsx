import { Heart, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <header className="bg-primary text-white shadow-md px-4 py-3 flex items-center justify-between shrink-0 z-30 relative">
      <div className="flex items-center gap-2.5">
        <Heart className="w-5 h-5 text-green-200 shrink-0" />
        <span className="font-display font-semibold tracking-wide hidden sm:block text-base">
          銀髮關懷據點智慧管理系統
        </span>
        <span className="font-display font-semibold tracking-wide sm:hidden text-sm">
          關懷據點管理
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* 使用者資訊（桌機顯示） */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isAdmin ? 'bg-white/20 text-white' : 'bg-green-100/30 text-green-100'
            }`}>
              {user.role}
            </span>
            <span className="text-sm text-green-100">{user.name}</span>
          </div>
        )}

        <button className="relative p-1.5 hover:bg-primary-light rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-400 rounded-full" />
        </button>

        <button
          onClick={logout}
          title="登出"
          className="p-1.5 hover:bg-primary-light rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
