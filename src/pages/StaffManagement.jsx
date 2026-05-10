import { useState, useEffect } from 'react'
import { ShieldCheck, UserPlus, Trash2, Lock, User, Building2, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudit } from '../contexts/AuditContext'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { getActiveOrganizations } from '../services/api/organizations'
import { getStaffAccounts, addStaffAccount, removeStaffAccount } from '../services/api/staff'

const ROLE_STYLE = {
  '超級管理者': 'bg-purple-100 text-purple-700',
  '管理者':     'bg-green-100 text-green-700',
  '關懷站專員': 'bg-blue-100 text-blue-700',
}

export default function StaffManagement() {
  const { user, users, currentOrg, isAdmin, isSuperAdmin, addAdminUser, removeAdminUser } = useAuth()
  const { addLog } = useAudit()

  const [orgs, setOrgs]                 = useState([])
  const [staffList, setStaffList]       = useState([])
  const [showForm, setShowForm]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError, setFormError]       = useState('')
  const [form, setForm]                 = useState({
    name: '', google_email: '', org_id: currentOrg?.id ?? 1, role: '關懷站專員',
    // Admin-only fields
    username: '', password: '',
  })

  useEffect(() => {
    getActiveOrganizations().then(setOrgs)
    getStaffAccounts().then(setStaffList)
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

  // Merge: admin-level users (in-memory) + DB staff
  const adminUsers  = users.filter(u => isSuperAdmin || u.role !== '超級管理者')
  const allAccounts = [
    ...adminUsers.map(u => ({ ...u, _source: 'memory' })),
    ...staffList.map(s => ({
      id:           s.id,
      name:         s.name,
      role:         '關懷站專員',
      org_id:       s.org_id,
      google_email: s.google_email,
      _source:      'db',
    })),
  ]

  function resetForm() {
    setForm({ name: '', google_email: '', org_id: currentOrg?.id ?? 1, role: '關懷站專員', username: '', password: '' })
    setFormError('')
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')

    if (form.role === '關懷站專員') {
      // Google-based staff → save to DB
      const emailTrimmed = form.google_email.trim().toLowerCase()
      if (!emailTrimmed.includes('@')) { setFormError('請輸入有效的 Google Email'); return }
      if (staffList.some(s => s.google_email === emailTrimmed)) {
        setFormError('此 Email 已存在')
        return
      }
      const orgName = orgs.find(o => o.id === Number(form.org_id))?.name ?? ''
      try {
        await addStaffAccount({ name: form.name.trim(), org_id: Number(form.org_id), google_email: emailTrimmed })
        const updated = await getStaffAccounts()
        setStaffList(updated)
        addLog({ action: '新增', module: '帳號管理', target: form.name.trim(), detail: `新增關懷站專員 Google 帳號 ${emailTrimmed}，所屬單位：${orgName}` })
        resetForm()
        setShowForm(false)
      } catch (err) {
        setFormError('新增失敗：' + err.message)
      }
    } else {
      // Admin-level → in-memory
      if (!form.username.trim() || !form.password) { setFormError('請填寫帳號與密碼'); return }
      if (users.some(u => u.username === form.username.trim())) {
        setFormError('此帳號已存在')
        return
      }
      const orgName = orgs.find(o => o.id === Number(form.org_id))?.name ?? ''
      addAdminUser({ username: form.username.trim(), password: form.password, name: form.name.trim(), org_id: Number(form.org_id), role: form.role })
      addLog({ action: '新增', module: '帳號管理', target: form.name.trim(), detail: `新增${form.role}帳號 ${form.username.trim()}，所屬單位：${orgName}` })
      resetForm()
      setShowForm(false)
    }
  }

  async function confirmRemove() {
    if (!deleteTarget) return
    if (deleteTarget._source === 'db') {
      await removeStaffAccount(deleteTarget.id)
      setStaffList(prev => prev.filter(s => s.id !== deleteTarget.id))
    } else {
      removeAdminUser(deleteTarget.id)
    }
    addLog({ action: '刪除', module: '帳號管理', target: deleteTarget.name, detail: `刪除帳號 ${deleteTarget.google_email ?? deleteTarget.username}` })
    setDeleteTarget(null)
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> 帳號管理
          </h1>
          <p className="text-sm text-gray-400 mt-1">共 {allAccounts.length} 個帳號</p>
        </div>
        <button onClick={() => { setShowForm(p => !p); resetForm() }}
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
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例：王小明" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">所屬單位 *</label>
              <select required value={form.org_id}
                onChange={e => setForm(p => ({ ...p, org_id: Number(e.target.value) }))}
                disabled={!isSuperAdmin}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500">
                {orgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
              </select>
              {!isSuperAdmin && <p className="text-xs text-gray-400 mt-0.5">自動設為目前登入單位</p>}
            </div>

            {isSuperAdmin && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">角色 *</label>
                <select value={form.role}
                  onChange={e => { setForm(p => ({ ...p, role: e.target.value })); setFormError('') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="關懷站專員">關懷站專員（Google 登入）</option>
                  <option value="管理者">管理者（帳號密碼）</option>
                </select>
              </div>
            )}

            {/* 關懷站專員：填 Google Email */}
            {form.role === '關懷站專員' && (
              <div className={isSuperAdmin ? '' : 'md:col-span-2'}>
                <label className="text-xs text-gray-500 block mb-1">Google Email *</label>
                <input required type="email" value={form.google_email}
                  onChange={e => { setForm(p => ({ ...p, google_email: e.target.value })); setFormError('') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="例：staff@gmail.com" />
                <p className="text-xs text-gray-400 mt-0.5">填入員工的 Google 帳號，他即可用 Google 登入</p>
              </div>
            )}

            {/* 管理者：填帳號密碼 */}
            {form.role !== '關懷站專員' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">帳號 *</label>
                  <input required value={form.username}
                    onChange={e => { setForm(p => ({ ...p, username: e.target.value })); setFormError('') }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="例：admin02" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">密碼 *</label>
                  <input required type="password" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="設定初始密碼" />
                </div>
              </>
            )}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">建立帳號</button>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
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
              const isSelf             = u.id === user.id && u._source === 'memory'
              const isProtected        = u.role === '管理者' || u.role === '超級管理者'
              const canDelete          = !isSelf && !isProtected
              return (
                <tr key={`${u._source}-${u.id}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-gray-500">
                    {u.google_email ?? u.username}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {u.org_id
                        ? (orgs.find(o => o.id === u.org_id)?.short_name ?? `單位 ${u.org_id}`)
                        : <span className="text-purple-500">全平台</span>
                      }
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {u.google_email
                      ? <span className="text-xs flex items-center gap-1 text-blue-600"><svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</span>
                      : <span className="text-xs text-gray-400">帳號密碼</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canDelete ? (
                      <button onClick={() => setDeleteTarget(u)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300 px-3">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 font-medium mb-1">權限說明</p>
        <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
          <li>關懷站專員：填入 Google Email，員工用 Google 帳號一鍵登入，無需記密碼</li>
          <li>管理者：帳號密碼登入，可新增修改刪除所有資料</li>
          <li>管理者與超級管理者帳號無法被刪除；無法刪除自己的帳號</li>
        </ul>
      </div>
    </div>
  )
}
