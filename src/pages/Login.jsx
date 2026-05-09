import { useState, useEffect } from 'react'
import { Heart, AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveOrganizations } from '../services/api/organizations'
import { loadOrg } from '../config/org'

export default function Login() {
  const { login } = useAuth()
  const [orgs, setOrgs]           = useState([])
  const [orgLoading, setOrgLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [rememberOrg, setRememberOrg] = useState(true)
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    getActiveOrganizations().then(list => {
      setOrgs(list)
      // 自動還原上次記憶的組織
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

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 組織選擇 */}
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
                      <option key={o.id} value={o.id}>
                        {o.short_name || o.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* 記住單位 */}
            <label className="flex items-center gap-2 cursor-pointer -mt-1">
              <input
                type="checkbox"
                checked={rememberOrg}
                onChange={e => setRememberOrg(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-gray-500">記住所屬單位，下次自動帶入</span>
            </label>

            {/* 帳號 */}
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

            {/* 密碼 */}
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
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
