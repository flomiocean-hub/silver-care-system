import { Bell, Heart } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="bg-primary text-white shadow-md px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-green-200" />
        <span className="font-display text-lg font-semibold tracking-wide">銀髮關懷據點智慧管理系統</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-green-200">展示版 Demo</span>
        <button className="relative p-1 hover:bg-primary-light rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>
      </div>
    </header>
  )
}
