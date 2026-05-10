import { useState, useEffect } from 'react'
import { Heart, AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveOrganizations } from '../services/api/organizations'
import { loadOrg } from '../config/org'

export default function Login() {
  const { login, loginWithGoogle, googleError } = useAuth()
  const [orgs, setOrgs]                 = useState([])
  const [orgLoading, setOrgLoading]     = useState(true)
  const [selectedOrg, setSelectedOrg]   = useState(null)
  const [rememberOrg, setRememberOrg]   = useState(true)
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    getActiveOrganizations().then(list => {
      setOrgs(list)
      const remembered = loadOrg()
      if (remembered) {
        const match = list.find(o => o.id === remembered.id)
        if (match) setSelectedOrg(match)
      } else if (list.length === 1) {
        setSelectedOrg(list[0])
      }
      setOrgLoading(false)
    })
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selectedOrg) { setError('請先選擇所屬單位'); return }
    setLoading(true)
    setTimeout(() => {
      const ok = login(username.trim(), password, selectedOrg, rememberOrg)
      if (!ok) setError('帳號、密碼或所屬單位不符，請再確認')
      setLoading(false)
    }, 400)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await loginWithGoogle()
    // Page will redirect to Google — loading state clears on return
    setGoogleLoading(false)
  }

  const displayError = error || googleError

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
          {selectedOrg && (
            <p className="text-xs text-gray-500 mt-2 px-2 leading-relaxed">{selectedOrg.name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">請登入以繼續使用</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

          {/* Google 登入（關懷站專員）*/}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">關懷站專員</p>
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? '跳轉中...' : '用 Google 帳號登入'}
            </button>
          </div>

          {/* 分隔線 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">管理者帳號</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* 帳密登入（管理者 / 超級管理者）*/}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">所屬單位 *</label>
              {orgLoading ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> 載入中...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedOrg?.id ?? ''}
                    onChange={e => {
                      const org = orgs.find(o => o.id === Number(e.target.value))
                      setSelectedOrg(org ?? null)
                      setError('')
                    }}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition bg-white pr-10"
                  >
                    <option value="">— 請選擇單位 —</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.short_name || o.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer -mt-1">
              <input
                type="checkbox"
                checked={rememberOrg}
                onChange={e => setRememberOrg(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-gray-500">記住所屬單位，下次自動帶入</span>
            </label>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
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
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="輸入密碼"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password || !selectedOrg}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中…' : '登入'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium">展示版帳號</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                <span className="text-xs text-purple-700 font-medium">超級管理者</span>
                <span className="text-xs text-purple-600 font-mono">superadmin / super2025</span>
              </div>
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <span className="text-xs text-green-700 font-medium">管理者</span>
                <span className="text-xs text-green-600 font-mono">admin / admin2025</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-700 font-medium">關懷站專員</span>
                <span className="text-xs text-blue-600">用 Google 帳號登入（需先被新增）</span>
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
