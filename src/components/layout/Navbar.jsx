import { Bell, Heart, Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-primary text-white shadow-md px-4 py-3 flex items-center justify-between shrink-0 z-30 relative">
      <div className="flex items-center gap-2.5">
        <Heart className="w-5 h-5 text-green-200 shrink-0" />
        {/* 桌機顯示完整名稱，手機縮短 */}
        <span className="font-display font-semibold tracking-wide hidden sm:block text-base">
          銀髮關懷據點智慧管理系統
        </span>
        <span className="font-display font-semibold tracking-wide sm:hidden text-sm">
          關懷據點管理
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-green-200 hidden sm:block">展示版 Demo</span>
        <button className="relative p-1.5 hover:bg-primary-light rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>
      </div>
    </header>
  )
}
