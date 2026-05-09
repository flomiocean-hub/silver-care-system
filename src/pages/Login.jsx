import { useState } from 'react'
import { Heart, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const ok = login(username.trim(), password)
      if (!ok) setError(true)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">銀髮關懷據點</h1>
          <h2 className="text-lg font-semibold text-primary leading-tight">智慧管理系統</h2>
          <p className="text-sm text-gray-400 mt-2">請登入以繼續使用</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(false) }}
                placeholder="輸入帳號"
                autoComplete="username"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="輸入密碼"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">帳號或密碼錯誤，請再試一次</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中…' : '登入'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium">展示版帳號</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <span className="text-xs text-green-700 font-medium">管理者</span>
                <span className="text-xs text-green-600 font-mono">admin / admin2025</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-700 font-medium">關懷站專員</span>
                <span className="text-xs text-blue-600 font-mono">staff01 / staff2025</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 銀髮關懷據點智慧管理系統
        </p>
      </div>
    </div>
  )
}
