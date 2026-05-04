import { useState } from 'react'
import { Search, UserPlus, Trash2, Edit3, Phone, MapPin, User, Home } from 'lucide-react'
import { mockMembers } from '../services/mockData'
import { getRiskLevel } from '../utils/riskScoring'
import AdminPasswordModal from '../components/layout/AdminPasswordModal'

const TAG_COLORS = {
  '獨居':     'bg-orange-100 text-orange-700',
  '高風險':   'bg-red-100 text-red-700',
  '今日出席': 'bg-green-100 text-green-700',
  '探訪':     'bg-purple-100 text-purple-700',
  '電訪追蹤': 'bg-blue-100 text-blue-700',
}

const MEMBER_TYPES = ['出席型', '探訪型']

const AVAILABLE_TAGS = ['獨居', '高風險', '電訪追蹤', '探訪']

const FILTER_OPTIONS = [
  { key: 'all',     label: '全部' },
  { key: 'alone',   label: '獨居' },
  { key: 'high',    label: '高風險' },
  { key: 'absent',  label: '久未出席' },
  { key: 'visit',   label: '探訪型' },
  { key: 'phone',   label: '電訪追蹤' },
]

function generateId(members) {
  const max = members.reduce((m, mb) => {
    const n = parseInt(mb.id.split('-')[1] || '0')
    return n > m ? n : m
  }, 0)
  return `SC-${String(max + 1).padStart(3, '0')}`
}

export default function Members() {
  const [members, setMembers] = useState(mockMembers)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [modal, setModal] = useState(null) // 'delete' | 'edit'

  const emptyForm = {
    name: '', birthday: '', gender: '女', mobile: '', home_phone: '', address: '',
    emergency_contact: '', member_type: '出席型', tags: [], notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const filtered = members.filter(m => {
    const q = !query || m.name.includes(query)
    const f =
      filter === 'all'    ? true :
      filter === 'alone'  ? m.tags.includes('獨居') :
      filter === 'high'   ? m.risk_score >= 70 :
      filter === 'absent' ? new Date(m.last_seen) < new Date(Date.now() - 14 * 86400000) :
      filter === 'visit'  ? m.member_type === '探訪型' :
      filter === 'phone'  ? m.tags.includes('電訪追蹤') : true
    return q && f
  })

  function toggleTag(tag) {
    setForm(p => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag]
    }))
  }

  function handleAdd(e) {
    e.preventDefault()
    const member = {
      ...form,
      id: generateId(members),
      join_date: new Date().toISOString().slice(0, 10),
      last_seen: new Date().toISOString().slice(0, 10),
      risk_score: form.tags.includes('獨居') ? 30 : 5,
      status: '活躍',
      weight_baseline: null,
    }
    setMembers(p => [...p, member])
    setForm(emptyForm)
    setShowForm(false)
  }

  function startEdit(m) {
    setEditTarget(m)
    setModal('edit')
  }

  function startDelete(m) {
    setDeleteTarget(m)
    setModal('delete')
  }

  function confirmDelete() {
    setMembers(p => p.filter(m => m.id !== deleteTarget.id))
    setModal(null)
    setDeleteTarget(null)
  }

  function confirmEdit() {
    setForm({ ...editTarget })
    setModal(null)
    setShowForm('edit')
  }

  function handleEditSave(e) {
    e.preventDefault()
    setMembers(p => p.map(m => m.id === form.id ? { ...m, ...form } : m))
    setShowForm(false)
    setEditTarget(null)
    setForm(emptyForm)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {modal === 'delete' && (
        <AdminPasswordModal
          title={`確定要刪除「${deleteTarget?.name}」的資料嗎？此操作無法復原。`}
          onConfirm={confirmDelete}
          onCancel={() => { setModal(null); setDeleteTarget(null) }}
        />
      )}
      {modal === 'edit' && (
        <AdminPasswordModal
          title={`確定要修改「${editTarget?.name}」的資料嗎？請輸入管理員密碼繼續。`}
          onConfirm={confirmEdit}
          onCancel={() => { setModal(null); setEditTarget(null) }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">長者管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {members.length} 位會員</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowForm('add') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors text-sm font-medium shadow-sm">
          <UserPlus className="w-4 h-4" /> 新增長者
        </button>
      </div>

      {showForm && (
        <form onSubmit={showForm === 'edit' ? handleEditSave : handleAdd}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">{showForm === 'edit' ? '修改長者資料' : '新增長者資料'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">姓名 *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">生日 *</label>
              <input required type="date" value={form.birthday} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">性別</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option>女</option><option>男</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">服務類型</label>
              <select value={form.member_type} onChange={e => setForm(p => ({ ...p, member_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {MEMBER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">個人手機</label>
              <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="09XX-XXX-XXX" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">家裡電話</label>
              <input value={form.home_phone} onChange={e => setForm(p => ({ ...p, home_phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="02-XXXX-XXXX" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">通訊地址</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">緊急聯絡人（姓名 電話）</label>
              <input value={form.emergency_contact} onChange={e => setForm(p => ({ ...p, emergency_contact: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="王小明 0912-345-678" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">健康備註</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-2">狀態標籤</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button type="button" key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.tags.includes(tag)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-primary'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
              {showForm === 'edit' ? '儲存修改' : '新增'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜尋姓名…" value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(m => {
          const risk = getRiskLevel(m.risk_score)
          return (
            <div key={m.id} className={`bg-white rounded-xl border shadow-sm p-4 ${risk.border}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${risk.bg} shrink-0`}>
                    <User className={`w-5 h-5 ${risk.text}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{m.name}</p>
                      <span className="text-xs text-gray-400">{m.id}</span>
                    </div>
                    <p className="text-xs text-gray-400">{m.birthday} · {m.gender} · {m.member_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(m)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => startDelete(m)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {m.tags.map(tag => (
                  <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                    {tag}
                  </span>
                ))}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.bg} ${risk.text}`}>
                  {risk.label}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                {m.mobile && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {m.mobile}
                    {m.home_phone && <span className="text-gray-400">/ {m.home_phone}</span>}
                  </p>
                )}
                {m.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {m.address}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-red-400" />
                  <span className="text-red-500 font-medium">緊急：</span>{m.emergency_contact || '未填寫'}
                </p>
                <p>最後出席：{m.last_seen}</p>
                {m.notes && <p className="text-gray-400 italic">{m.notes}</p>}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                  <div className={`h-1.5 rounded-full ${m.risk_score >= 70 ? 'bg-red-500' : m.risk_score >= 40 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${m.risk_score}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-14 text-right shrink-0">風險 {m.risk_score}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
