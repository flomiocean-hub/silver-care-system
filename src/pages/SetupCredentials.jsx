import { useState } from 'react'
import { KeyRound, Check, SkipForward } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { setUserCredentials } from '../services/api/users'

export default function SetupCredentials() {
  const { user, dismissSetup, finishSetup } = useAuth()
  const [form, setForm]     = useState({ username: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.username.trim()) { setError('請輸入帳號'); return }
    if (form.password.length < 6) { setError('密碼至少 6 個字元'); return }
    if (form.password !== form.confirm) { setError('兩次密碼不一致'); return }
    setSaving(true)
    try {
      await setUserCredentials(user.id, form.username.trim(), form.password)
      finishSetup(form.username.trim())
    } catch (err) {
      setError('設定失敗：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">設定帳號密碼</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            您好，{user?.name}！<br />
            可為帳號設定帳號密碼，日後不依賴 Google 也能登入。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">帳號</label>
            <input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="設定登入帳號（英數字）"
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">密碼</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="至少 6 個字元"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">確認密碼</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="再輸入一次密碼"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving ? '設定中...' : '完成設定'}
          </button>
        </form>

        <button
          onClick={dismissSetup}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          稍後再說，直接進入系統
        </button>
      </div>
    </div>
  )
}
