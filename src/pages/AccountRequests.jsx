import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Loader2, X, Phone, Mail, Building2, CalendarClock, ChevronDown } from 'lucide-react'
import { getAccountRequests, updateAccountRequest } from '../services/api/users'

const STATUS_CONFIG = {
  pending:    { label: '待處理', color: 'bg-gray-100 text-gray-600' },
  in_contact: { label: '聯絡中', color: 'bg-blue-100 text-blue-700' },
  approved:   { label: '已核准', color: 'bg-green-100 text-green-700' },
  rejected:   { label: '已拒絕', color: 'bg-red-100 text-red-600' },
}

const FILTER_OPTIONS = [
  { key: 'all',        label: '全部' },
  { key: 'pending',    label: '待處理' },
  { key: 'in_contact', label: '聯絡中' },
  { key: 'approved',   label: '已核准' },
  { key: 'rejected',   label: '已拒絕' },
]

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AccountRequests() {
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState('all')
  const [selected, setSelected]     = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes]   = useState('')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setRequests(await getAccountRequests())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openDetail(req) {
    setSelected(req)
    setEditStatus(req.status ?? 'pending')
    setEditNotes(req.notes ?? '')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await updateAccountRequest(selected.id, {
      status: editStatus,
      notes: editNotes,
      contacted_at: editStatus === 'in_contact' && !selected.contacted_at
        ? new Date().toISOString()
        : selected.contacted_at ?? null,
    })
    await load()
    setSelected(prev => ({ ...prev, status: editStatus, notes: editNotes }))
    setSaving(false)
  }

  const filtered = requests.filter(r =>
    filterStatus === 'all' || (r.status ?? 'pending') === filterStatus
  )

  const counts = {
    pending:    requests.filter(r => (r.status ?? 'pending') === 'pending').length,
    in_contact: requests.filter(r => r.status === 'in_contact').length,
    approved:   requests.filter(r => r.status === 'approved').length,
    rejected:   requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> 帳號申請管理
        </h1>
        <p className="text-sm text-gray-400 mt-1">共 {requests.length} 筆申請</p>
      </div>

      {/* 統計卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'pending',    label: '待處理', color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { key: 'in_contact', label: '聯絡中', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { key: 'approved',   label: '已核准', color: 'bg-green-50 border-green-200 text-green-700' },
          { key: 'rejected',   label: '已拒絕', color: 'bg-red-50 border-red-200 text-red-600' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key === filterStatus ? 'all' : key)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${color} ${filterStatus === key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}>
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs mt-0.5 font-medium">{label}</p>
          </button>
        ))}
      </div>

      {/* 篩選 */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterStatus === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">目前無符合的申請記錄</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 whitespace-nowrap">申請時間</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">單位</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">姓名</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">Email</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">電話</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">狀態</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">備註</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => {
                  const status = req.status ?? 'pending'
                  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
                  return (
                    <tr key={req.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openDetail(req)}>
                      <td className="py-3 px-4 font-mono text-xs text-gray-400 whitespace-nowrap">
                        {fmtTime(req.submitted_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap max-w-[140px] truncate" title={req.org_name}>
                        {req.org_name || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{req.name}</td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{req.email}</td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{req.phone || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 max-w-[160px] truncate" title={req.notes}>
                        {req.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 右側詳情抽屜 */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-800">{selected.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">申請於 {fmtTime(selected.submitted_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* 申請資訊 */}
              <section className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">所屬單位</p>
                    <p className="text-sm font-medium text-gray-700">{selected.org_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <a href={`mailto:${selected.email}`}
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={e => e.stopPropagation()}>
                      {selected.email}
                    </a>
                  </div>
                </div>
                {selected.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">連絡電話</p>
                      <a href={`tel:${selected.phone}`}
                        className="text-sm font-medium text-gray-700 hover:text-primary"
                        onClick={e => e.stopPropagation()}>
                        {selected.phone}
                      </a>
                    </div>
                  </div>
                )}
                {selected.contacted_at && (
                  <div className="flex items-start gap-2.5">
                    <CalendarClock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">首次聯絡時間</p>
                      <p className="text-sm text-gray-700">{fmtTime(selected.contacted_at)}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* 進度追蹤 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">聯絡進度追蹤</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">目前狀態</label>
                    <div className="relative">
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white pr-8"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">聯絡備註</label>
                    <textarea
                      rows={4}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="記錄聯絡結果、後續行動、特殊說明…"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? '儲存中…' : '儲存進度'}
                  </button>
                </div>
              </section>

              {/* 快捷操作 */}
              <section className="flex gap-2">
                <a href={`mailto:${selected.email}?subject=關於您的系統帳號申請`}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Mail className="w-4 h-4" /> 發送 Email
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" /> 撥打電話
                  </a>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
