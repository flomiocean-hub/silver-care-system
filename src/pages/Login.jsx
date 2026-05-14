import { useState, useEffect } from 'react'
import { Heart, AlertCircle, ChevronDown, Loader2, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActiveOrganizations } from '../services/api/organizations'
import { loadOrg } from '../config/org'
import { submitAccountRequest } from '../services/api/users'

export default function Login() {
  const {
    login, completeSuperAdminLogin, loginWithGoogle,
    googleError, setGoogleError, pendingSuperAdmin,
  } = useAuth()

  const [orgs, setOrgs]                   = useState([])
  const [orgLoading, setOrgLoading]       = useState(true)
  const [selectedOrg, setSelectedOrg]     = useState(null)
  const [rememberOrg, setRememberOrg]     = useState(true)
  const [filterCity, setFilterCity]       = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [username, setUsername]           = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showApply, setShowApply]         = useState(false)
  const [applyForm, setApplyForm]         = useState({ org_id: '', org_name: '', name: '', email: '', phone: '' })
  const [applyLoading, setApplyLoading]   = useState(false)
  const [applySuccess, setApplySuccess]   = useState(false)
  const [applyError, setApplyError]       = useState('')

  useEffect(() => {
    getActiveOrganizations()
      .then(list => {
        setOrgs(list)
        const remembered = loadOrg()
        if (remembered) {
          const match = list.find(o => o.id === remembered.id)
          if (match) {
            setSelectedOrg(match)
            if (match.city)     setFilterCity(match.city)
            if (match.district) setFilterDistrict(match.district)
          }
        } else if (list.length === 1) {
          setSelectedOrg(list[0])
        }
      })
      .catch(() => {})
      .finally(() => setOrgLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(username.trim(), password)
      if (!result.ok) setError('帳號或密碼錯誤，請再確認')
    } catch {
      setError('連線失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  function handleOrgConfirm() {
    if (!selectedOrg) return
    completeSuperAdminLogin(selectedOrg)
  }

  async function handleApplySubmit(e) {
    e.preventDefault()
    setApplyLoading(true)
    setApplyError('')
    try {
      const org = orgs.find(o => o.id === Number(applyForm.org_id))
      await submitAccountRequest({
        org_id:   org?.id ?? null,
        org_name: org?.name ?? applyForm.org_name,
        name:     applyForm.name.trim(),
        email:    applyForm.email.trim(),
        phone:    applyForm.phone.trim(),
      })
      setApplySuccess(true)
    } catch {
      setApplyError('送出失敗，請稍後再試')
    } finally {
      setApplyLoading(false)
    }
  }

  function openApply() {
    setApplyForm({ org_id: '', org_name: '', name: '', email: '', phone: '' })
    setApplySuccess(false)
    setApplyError('')
    setShowApply(true)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setGoogleError('')
    await loginWithGoogle()
    setGoogleLoading(false)
  }

  const displayError = error || googleError

  // ── 超級管理者選組織（第二步）──
  if (pendingSuperAdmin) {
    const cities = [...new Set(orgs.map(o => o.city).filter(Boolean))].sort()
    const districts = [...new Set(
      orgs
        .filter(o => !filterCity || o.city === filterCity)
        .map(o => o.district)
        .filter(Boolean)
    )].sort()
    const filteredOrgs = orgs.filter(o => {
      if (filterCity     && o.city     !== filterCity)     return false
      if (filterDistrict && o.district !== filterDistrict) return false
      return true
    })

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">選擇管理組織</h2>
            <p className="text-xs text-gray-400 mt-1">歡迎，{pendingSuperAdmin.name}。請選擇本次要管理的單位</p>
          </div>

          {orgLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> 載入中...
            </div>
          ) : (
            <div className="space-y-2">
              {/* 縣市 + 行政區 篩選（有 city 資料才顯示）*/}
              {cities.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={filterCity}
                      onChange={e => {
                        setFilterCity(e.target.value)
                        setFilterDistrict('')
                        setSelectedOrg(null)
                      }}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white pr-7 text-gray-700"
                    >
                      <option value="">全部縣市</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={filterDistrict}
                      onChange={e => {
                        setFilterDistrict(e.target.value)
                        setSelectedOrg(null)
                      }}
                      disabled={!filterCity}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white pr-7 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">全部行政區</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* 單位下拉 */}
              <div className="relative">
                <select
                  value={selectedOrg?.id ?? ''}
                  onChange={e => setSelectedOrg(filteredOrgs.find(o => o.id === Number(e.target.value)) ?? null)}
                  className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white pr-10"
                >
                  <option value="">
                    {filteredOrgs.length === 0 ? '— 此條件無合作單位 —' : '— 請選擇單位 —'}
                  </option>
                  {filteredOrgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 已選單位的縣市 / 行政區確認 */}
              {selectedOrg && (selectedOrg.city || selectedOrg.district) && (
                <p className="text-xs text-gray-400 text-center">
                  {[selectedOrg.city, selectedOrg.district].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberOrg} onChange={e => setRememberOrg(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-xs text-gray-500">記住此單位，下次自動帶入</span>
          </label>

          <button
            onClick={handleOrgConfirm}
            disabled={!selectedOrg}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            進入系統
          </button>
        </div>
      </div>
    )
  }

  // ── 主登入頁 ──
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

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

          {/* Google 登入 */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? '跳轉中...' : '用 Google 帳號登入'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">或使用帳號密碼</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">帳號</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="輸入帳號"
                autoComplete="username"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">密碼</label>
              <input
                type="password" value={password}
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
              disabled={loading || !username || !password}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中…' : '登入'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          還沒有帳號？
          <button onClick={openApply} className="ml-1 text-primary font-medium hover:underline">
            申請帳號使用
          </button>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          © 2026 銀髮關懷據點智慧管理系統
        </p>
      </div>

      {/* 申請帳號 Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowApply(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">申請帳號使用</h2>
                <p className="text-xs text-gray-400 mt-0.5">填寫後，我們將於 1–3 個工作天內與您連絡</p>
              </div>
              <button onClick={() => setShowApply(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {applySuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-semibold text-gray-800">申請已送出！</p>
                <p className="text-sm text-gray-500">我們將於 1–3 個工作天內<br />以 Email 或電話與您連絡。</p>
                <button onClick={() => setShowApply(false)}
                  className="mt-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
                  關閉
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">所屬單位 *</label>
                  <div className="relative">
                    <select
                      required
                      value={applyForm.org_id}
                      onChange={e => setApplyForm(p => ({ ...p, org_id: e.target.value }))}
                      className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white pr-8"
                    >
                      <option value="">— 請選擇單位 —</option>
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>{o.short_name || o.name}</option>
                      ))}
                      <option value="other">其他（請於備註說明）</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {[
                  { key: 'name',  label: '姓名 *',    type: 'text',  placeholder: '您的姓名',     required: true },
                  { key: 'email', label: 'Email *',   type: 'email', placeholder: 'yourname@example.com', required: true },
                  { key: 'phone', label: '連絡電話',  type: 'tel',   placeholder: '09XX-XXX-XXX',  required: false },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                    <input
                      type={type}
                      required={required}
                      value={applyForm[key]}
                      onChange={e => setApplyForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                    />
                  </div>
                ))}

                {applyError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{applyError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={applyLoading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                >
                  {applyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {applyLoading ? '送出中…' : '送出申請'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
