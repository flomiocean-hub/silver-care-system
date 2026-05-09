import { useState, useEffect } from 'react'
import { ShieldCheck, UserPlus, Trash2, Lock, User, Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudit } from '../contexts/AuditContext'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { getActiveOrganizations } from '../services/api/organizations'

const ROLE_STYLE = {
  '超級管理者': 'bg-purple-100 text-purple-700',
  '管理者':     'bg-green-100 text-green-700',
  '關懷站專員': 'bg-blue-100 text-blue-700',
}

export default function StaffManagement() {
  const { user, users, currentOrg, isAdmin, isSuperAdmin, addStaff, removeStaff } = useAuth()
  const visibleUsers = users.filter(u => isSuperAdmin || u.role !== '超級管理者')
  const { addLog } = useAudit()
  const [orgs, setOrgs]                   = useState([])
  const [showForm, setShowForm]           = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [form, setForm]                   = useState({ username: '', password: '', name: '', org_id: currentOrg?.id ?? 1 })
  const [formError, setFormError]         = useState('')

  useEffect(() => {
    getActiveOrganizations().then(setOrgs)
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

  function handleAdd(e) {
    e.preventDefault()
    if (users.some(u => u.username === form.username.trim())) {
      setFormError('此帳號已存在，請換一個帳號名稱')
      return
    }
    const orgName = orgs.find(o => o.id === Number(form.org_id))?.name ?? ''
    addStaff({ username: form.username.trim(), password: form.password, name: form.name.trim(), org_id: Number(form.org_id) })
    addLog({ action: '新增', module: '帳號管理', target: form.name.trim(), detail: `新增關懷站專員帳號 ${form.username.trim()}，所屬單位：${orgName}` })
    setForm({ username: '', password: '', name: '', org_id: currentOrg?.id ?? 1 })
    setFormError('')
    setShowForm(false)
  }

  function confirmRemove() {
    addLog({ action: '刪除', module: '帳號管理', target: deleteTarget.name, detail: `刪除帳號 ${deleteTarget.username}` })
    removeStaff(deleteTarget.id)
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
          <p className="text-sm text-gray-400 mt-1">共 {visibleUsers.length} 個帳號</p>
        </div>
        <button onClick={() => { setShowForm(p => !p); setFormError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light text-sm font-medium shadow-sm">
          <UserPlus className="w-4 h-4" /> 新增專員帳號
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">新增關懷站專員帳號</h3>
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
            <div>
              <label className="text-xs text-gray-500 block mb-1">帳號 *</label>
              <input required value={form.username}
                onChange={e => { setForm(p => ({ ...p, username: e.target.value })); setFormError('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例：staff02" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">密碼 *</label>
              <input required type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="設定初始密碼" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">建立帳號</button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
          <p className="text-xs text-gray-400">新建帳號角色固定為「關懷站專員」，管理者帳號無法在此建立。</p>
        </form>
      )}

      {/* 帳號列表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4">姓名</th>
              <th className="text-left py-3 px-4">帳號</th>
              <th className="text-left py-3 px-4 hidden md:table-cell">所屬單位</th>
              <th className="text-left py-3 px-4">角色</th>
              <th className="text-left py-3 px-4">狀態</th>
              <th className="text-right py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map(u => {
              const isSelf           = u.id === user.id
              const isProtectedAccount = u.role === '管理者' || u.role === '超級管理者'
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                      {isSelf && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">本人</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{u.username}</td>
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
                  <td className="py-3 px-4">
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">使用中</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!isSelf && !isProtectedAccount ? (
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
          <li>管理者：可新增、修改、刪除所有資料，並管理帳號</li>
          <li>關懷站專員：可新增與修改，不可刪除任何資料</li>
          <li>管理者帳號無法被刪除；無法刪除自己的帳號</li>
        </ul>
      </div>
    </div>
  )
}
