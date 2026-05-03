import { useState } from 'react'
import { Search, UserPlus, AlertCircle, AlertTriangle, CheckCircle, Home, User } from 'lucide-react'
import { mockMembers } from '../services/mockData'
import { getRiskLevel } from '../utils/riskScoring'

export default function Members() {
  const [members, setMembers] = useState(mockMembers)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', birthday: '', gender: '女', is_alone: false, emergency_contact: '', notes: '' })

  const filtered = members.filter(m => {
    const matchQuery = !query || m.name.includes(query)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'alone' ? m.is_alone :
      filter === 'high' ? m.risk_score >= 70 :
      filter === 'absent' ? new Date(m.last_seen) < new Date(Date.now() - 14 * 86400000) : true
    return matchQuery && matchFilter
  })

  function handleAdd(e) {
    e.preventDefault()
    const newMember = {
      ...form,
      id: `M${String(members.length + 1).padStart(3, '0')}`,
      join_date: new Date().toISOString().slice(0, 10),
      last_seen: new Date().toISOString().slice(0, 10),
      risk_score: form.is_alone ? 30 : 5,
      status: '活躍',
    }
    setMembers(prev => [...prev, newMember])
    setForm({ name: '', birthday: '', gender: '女', is_alone: false, emergency_contact: '', notes: '' })
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">長者管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {members.length} 位會員</p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors text-sm font-medium shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> 新增長者
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">新增長者資料</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">姓名 *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="輸入姓名" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">生日 *（作為識別碼）</label>
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
              <label className="text-xs text-gray-500 block mb-1">緊急聯絡人</label>
              <input value={form.emergency_contact} onChange={e => setForm(p => ({ ...p, emergency_contact: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="姓名 電話" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">備註</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="健康狀況等" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="alone" checked={form.is_alone}
                onChange={e => setForm(p => ({ ...p, is_alone: e.target.checked }))} className="rounded" />
              <label htmlFor="alone" className="text-sm text-gray-600">獨居（將提高風險評分）</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">新增</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋姓名…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all','全部'],['alone','獨居'],['high','高風險'],['absent','久未出席']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === val ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => {
          const risk = getRiskLevel(m.risk_score)
          return (
            <div key={m.id} className={`bg-white rounded-xl border shadow-sm p-4 ${risk.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${risk.bg}`}>
                    <User className={`w-5 h-5 ${risk.text}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.birthday} · {m.gender}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>{risk.label}</span>
                  {m.is_alone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Home className="w-3 h-3" /> 獨居
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>最後出席：{m.last_seen}</p>
                <p>緊急聯絡：{m.emergency_contact || '未填寫'}</p>
                {m.notes && <p className="text-gray-400 italic">{m.notes}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                  <div className={`h-1.5 rounded-full ${m.risk_score >= 70 ? 'bg-red-500' : m.risk_score >= 40 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${m.risk_score}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">風險 {m.risk_score}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
