import { useState, useEffect, useMemo } from 'react'
import { ShieldCheck, UserPlus, Trash2, Lock, User, Building2, Mail, Pencil, Search, RotateCcw, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudit } from '../contexts/AuditContext'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { getActiveOrganizations } from '../services/api/organizations'
import { getAllUsers, createUser, updateUser, deleteUser, resetUserCredentials, setUserCredentials } from '../services/api/users'

const ROLE_STYLE = {
  '超級管理者': 'bg-purple-100 text-purple-700',
  '管理者':     'bg-green-100 text-green-700',
  '關懷站專員': 'bg-blue-100 text-blue-700',
}

const SUPERADMIN_ROW = {
  id: 0, name: 'Marco', role: '超級管理者', org_id: null,
  username: 'superadmin', google_email: null, _superadmin: true,
}

export default function StaffManagement() {
  const { user, isAdmin, isSuperAdmin, updateLocalUser } = useAuth()
  const { addLog } = useAudit()

  const [orgs, setOrgs]                 = useState([])
  const [dbUsers, setDbUsers]           = useState([])
  const [showForm, setShowForm]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [resetTarget, setResetTarget]   = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [formError, setFormError]       = useState('')
  const [editError, setEditError]       = useState('')
  const [form, setForm]                 = useState({
    name: '', role: '關懷站專員', org_id: '', google_email: '',
  })
  const [editForm, setEditForm] = useState({
    name: '', role: '', org_id: '',
    google_email: '', username: '', password: '',
  })
  const [filterName, setFilterName]         = useState('')
  const [filterOrg,  setFilterOrg]          = useState('')
  const [showSelfCredForm, setShowSelfCredForm] = useState(false)
  const [selfCredForm, setSelfCredForm]         = useState({ username: '', newPw: '', confirmPw: '' })
  const [selfCredError, setSelfCredError]       = useState('')
  const [selfCredSaving, setSelfCredSaving]     = useState(false)

  useEffect(() => {
    getActiveOrganizations().then(setOrgs)
    getAllUsers().then(setDbUsers)
  }, [])

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Lock className="w-12 h-12 text-gray-200 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 mb-2">權限不足</h2>
        <p className="text-sm text-gray-400">帳號管理功能僅供管理者使用</p>
      </div>
    )
  }

  const allAccounts = useMemo(() => {
    const base = [
      ...(isSuperAdmin ? [SUPERADMIN_ROW] : []),
      ...dbUsers.filter(u => isSuperAdmin || u.role !== '超級管理者'),
    ]
    if (!isSuperAdmin) return base
    return base.filter(u => {
      if (filterOrg  && String(u.org_id) !== filterOrg && !u._superadmin) return false
      if (filterName) {
        const q = filterName.toLowerCase()
        if (!u.name?.toLowerCase().includes(q) &&
            !u.username?.toLowerCase().includes(q) &&
            !u.google_email?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [dbUsers, isSuperAdmin, filterName, filterOrg])

  function resetForm() {
    setForm({ name: '', role: '關懷站專員', org_id: '', google_email: '' })
    setFormError('')
  }

  function openEdit(u) {
    setEditTarget(u)
    setEditForm({
      name:         u.name,
      role:         u.role,
      org_id:       u.org_id ?? '',
      google_email: u.google_email ?? '',
      username:     u.username ?? '',
      password:     '',
    })
    setEditError('')
    setShowForm(false)
    setShowSelfCredForm(false)
  }

  function closeEdit() {
    setEditTarget(null)
    setEditError('')
  }

  function openSelfCredForm() {
    setSelfCredForm({ username: user.username ?? '', newPw: '', confirmPw: '' })
    setSelfCredError('')
    setShowSelfCredForm(true)
    setShowForm(false)
    setEditTarget(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    const orgId = isSuperAdmin ? Number(form.org_id) : user.org_id
    if (!orgId) { setFormError('請選擇所屬單位'); return }

    const email = form.google_email.trim().toLowerCase()
    if (!email.includes('@')) { setFormError('請輸入有效的 Google Email'); return }
    if (dbUsers.some(u => u.google_email === email)) { setFormError('此 Email 已存在'); return }

    try {
      await createUser({ name: form.name.trim(), role: form.role, org_id: orgId, google_email: email })
      const orgName = orgs.find(o => o.id === orgId)?.name ?? ''
      addLog({ action: '新增', module: '帳號管理', target: form.name.trim(), detail: `新增${form.role}帳號，所屬單位：${orgName}` })
      setDbUsers(await getAllUsers())
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError('新增失敗：' + err.message)
    }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setEditError('')
    const orgId = Number(editForm.org_id) || null
    if (!orgId) { setEditError('請選擇所屬單位'); return }
    try {
      await updateUser(editTarget.id, {
        name:         editForm.name.trim(),
        role:         editForm.role,
        org_id:       orgId,
        username:     editForm.username.trim() || null,
        password:     editForm.password || undefined,
        google_email: editForm.google_email.trim() || null,
      })
      const orgName = orgs.find(o => o.id === orgId)?.name ?? ''
      addLog({ action: '修改', module: '帳號管理', target: editForm.name.trim(), detail: `修改帳號資料，所屬單位：${orgName}` })
      setDbUsers(await getAllUsers())
      closeEdit()
    } catch (err) {
      setEditError('修改失敗：' + err.message)
    }
  }

  async function confirmRemove() {
    if (!deleteTarget || deleteTarget._superadmin) return
    await deleteUser(deleteTarget.id)
    addLog({ action: '刪除', module: '帳號管理', target: deleteTarget.name, detail: `刪除帳號 ${deleteTarget.google_email ?? deleteTarget.username}` })
    setDbUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  async function confirmReset() {
    if (!resetTarget) return
    try {
      await resetUserCredentials(resetTarget.id)
      addLog({ action: '重置', module: '帳號管理', target: resetTarget.name, detail: '重置帳號密碼，回復為純 Google 登入' })
      setDbUsers(await getAllUsers())
    } catch (err) {
      console.error('重置失敗:', err)
    } finally {
      setResetTarget(null)
    }
  }

  async function handleSelfCredentials(e) {
    e.preventDefault()
    setSelfCredError('')
    if (!selfCredForm.username.trim()) { setSelfCredError('請輸入帳號'); return }
    if (selfCredForm.newPw.length < 6) { setSelfCredError('密碼至少 6 個字元'); return }
    if (selfCredForm.newPw !== selfCredForm.confirmPw) { setSelfCredError('兩次密碼不一致'); return }
    const taken = dbUsers.some(u => u.username === selfCredForm.username.trim() && u.id !== user.id)
    if (taken) { setSelfCredError('此帳號已被使用，請換一個'); return }
    setSelfCredSaving(true)
    try {
      await setUserCredentials(user.id, selfCredForm.username.trim(), selfCredForm.newPw)
      updateLocalUser({ username: selfCredForm.username.trim() })
      addLog({ action: '修改', module: '帳號管理', target: user.name, detail: '設定／修改帳號密碼' })
      setDbUsers(await getAllUsers())
      setShowSelfCredForm(false)
      setSelfCredForm({ username: '', newPw: '', confirmPw: '' })
    } catch (err) {
      setSelfCredError('設定失敗：' + err.message)
    } finally {
      setSelfCredSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {deleteTarget && (
        <ConfirmDialog
          title={`確定要刪除「${deleteTarget.name}」的帳號嗎？`}
          message="刪除後該帳號將無法登入，此操作無法復原。"
          onConfirm={confirmRemove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {resetTarget && (
        <ConfirmDialog
          title={`確定要重置「${resetTarget.name}」的帳號密碼嗎？`}
          message="重置後該帳號將回復為純 Google 登入，原有帳號密碼將被清除。"
          onConfirm={confirmReset}
          onCancel={() => setResetTarget(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> 帳號管理
          </h1>
          <p className="text-sm text-gray-400 mt-1">共 {allAccounts.length} 個帳號</p>
        </div>
        <button onClick={() => { setShowForm(p => !p); resetForm(); setShowSelfCredForm(false); setEditTarget(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light text-sm font-medium shadow-sm">
          <UserPlus className="w-4 h-4" /> 新增帳號
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">新增帳號</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-xs text-gray-500 block mb-1">姓名 *</label>
              <input required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例：王小明" />
            </div>

            {isSuperAdmin && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">角色 *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="關懷站專員">關懷站專員</option>
                  <option value="管理者">管理者</option>
                </select>
              </div>
            )}

            {isSuperAdmin && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">所屬單位 *</label>
                <select required value={form.org_id}
                  onChange={e => setForm(p => ({ ...p, org_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">— 請選擇 —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
                </select>
                {(() => {
                  const org = orgs.find(o => String(o.id) === form.org_id)
                  const loc = [org?.city, org?.district].filter(Boolean).join(' · ')
                  return loc ? <p className="text-xs text-gray-400 mt-1">{loc}</p> : null
                })()}
              </div>
            )}

            <div className={isSuperAdmin ? '' : 'md:col-span-2'}>
              <label className="text-xs text-gray-500 block mb-1">Google Email *</label>
              <input
                type="email"
                required
                value={form.google_email}
                onChange={e => setForm(p => ({ ...p, google_email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例：staff@gmail.com" />
              <p className="text-xs text-gray-400 mt-1">建立後由使用者首次 Google 登入時自行設定帳號密碼</p>
            </div>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">建立帳號</button>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      {/* 編輯表單（超級管理者） */}
      {editTarget && (
        <form onSubmit={handleEdit} className="bg-white rounded-xl border border-primary/30 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">編輯帳號：{editTarget.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-xs text-gray-500 block mb-1">姓名 *</label>
              <input required value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">角色 *</label>
              <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="關懷站專員">關懷站專員</option>
                <option value="管理者">管理者</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">所屬單位 *</label>
              <select required value={editForm.org_id}
                onChange={e => setEditForm(p => ({ ...p, org_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">— 請選擇 —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Google Email</label>
              <input type="email" value={editForm.google_email}
                onChange={e => setEditForm(p => ({ ...p, google_email: e.target.value }))}
                placeholder="選填"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            {editForm.role !== '關懷站專員' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">帳號</label>
                  <input value={editForm.username}
                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">新密碼（留空不更改）</label>
                  <input type="password" value={editForm.password}
                    onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="留空則不修改"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </>
            )}
          </div>

          {editError && <p className="text-sm text-red-500">{editError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">儲存修改</button>
            <button type="button" onClick={closeEdit}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      {/* 修改自己帳密表單（管理者） */}
      {showSelfCredForm && (
        <form onSubmit={handleSelfCredentials} className="bg-white rounded-xl border border-amber-300 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            設定帳號密碼
          </h3>
          <p className="text-xs text-gray-500">設定後可使用帳號密碼登入，不依賴 Google 帳號。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">帳號 *</label>
              <input required value={selfCredForm.username}
                onChange={e => setSelfCredForm(p => ({ ...p, username: e.target.value }))}
                placeholder="設定登入帳號"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">新密碼 *</label>
              <input required type="password" value={selfCredForm.newPw}
                onChange={e => setSelfCredForm(p => ({ ...p, newPw: e.target.value }))}
                placeholder="至少 6 個字元"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">確認密碼 *</label>
              <input required type="password" value={selfCredForm.confirmPw}
                onChange={e => setSelfCredForm(p => ({ ...p, confirmPw: e.target.value }))}
                placeholder="再輸入一次"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          {selfCredError && <p className="text-sm text-red-500">{selfCredError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={selfCredSaving}
              className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
              {selfCredSaving ? '儲存中...' : '儲存'}
            </button>
            <button type="button" onClick={() => setShowSelfCredForm(false)}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      {/* 篩選列（超級管理者專屬）*/}
      {isSuperAdmin && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              placeholder="搜尋姓名 / 帳號 / Email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
            <option value="">全部單位</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
          </select>
          {(filterName || filterOrg) && (
            <button onClick={() => { setFilterName(''); setFilterOrg('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
              清除篩選
            </button>
          )}
          <span className="text-sm text-gray-400">顯示 {allAccounts.length} 筆</span>
        </div>
      )}

      {/* 帳號列表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4">姓名</th>
              <th className="text-left py-3 px-4 hidden md:table-cell">帳號 / Email</th>
              <th className="text-left py-3 px-4 hidden md:table-cell">所屬單位</th>
              <th className="text-left py-3 px-4">角色</th>
              <th className="text-left py-3 px-4 hidden sm:table-cell">登入方式</th>
              <th className="text-right py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {allAccounts.map(u => {
              const isSelf             = u.id === user?.id && !u._superadmin
              const canDelete          = u._superadmin ? false
                : isSuperAdmin ? true
                : (!isSelf && u.role !== '管理者')
              const canEdit            = !u._superadmin && isSuperAdmin
              const canReset           = !u._superadmin && u.username !== null && (
                isSuperAdmin || (isAdmin && u.role === '關懷站專員' && !isSelf)
              )
              const canManageSelfCred  = isSelf && isAdmin && !isSuperAdmin
              const orgName            = u.org_id
                ? (orgs.find(o => o.id === u.org_id)?.short_name ?? `單位 ${u.org_id}`)
                : null
              const loginId            = u.google_email ?? u.username ?? '—'

              return (
                <tr key={`${u._superadmin ? 'sa' : 'db'}-${u.id}`}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {u.google_email
                          ? <Mail className="w-4 h-4 text-blue-400" />
                          : <User className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                      {isSelf && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">本人</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-gray-500">{loginId}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {orgName ?? <span className="text-purple-500">全平台</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-400">
                    {u.google_email && u.username ? 'Google + 帳密'
                      : u.google_email ? <span className="text-blue-600 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>Google
                        </span>
                      : '帳號密碼'
                    }
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManageSelfCred && (
                        <button
                          onClick={openSelfCredForm}
                          title="設定帳號密碼"
                          className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => openEdit(u)}
                          title="編輯帳號"
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canReset && (
                        <button onClick={() => setResetTarget(u)}
                          title="重置帳號密碼"
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete ? (
                        <button onClick={() => setDeleteTarget(u)}
                          title="刪除帳號"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        !canEdit && !canManageSelfCred && <span className="text-xs text-gray-300 px-3">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 font-medium mb-1">登入方式說明</p>
        <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
          <li>關懷站專員：填入 Google Email，員工用 Google 一鍵登入；首次登入後可自行設定帳號密碼</li>
          <li>管理者：以 Google Email 建立帳號，首次登入後可自行設定帳號密碼，支援 Google 與帳密兩種方式</li>
          <li>超級管理者：帳號密碼登入，不存於資料庫，系統最高安全後門</li>
        </ul>
      </div>
    </div>
  )
}
