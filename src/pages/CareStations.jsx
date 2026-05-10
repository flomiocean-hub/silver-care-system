import { useState, useEffect, useMemo } from 'react'
import { Building2, Phone, MapPin, User, Search, X, Save, Loader2 } from 'lucide-react'
import { getCareStations, updateCareStation } from '../services/api/careStations'

const ORG_TYPE_LABELS = {
  GOV:   '里辦公處',
  ASSOC: '社區發展協會',
  FOUND: '財團法人',
  CORP:  '社團法人',
  REL:   '宗教',
  ELDER: '長者服務',
  OTHER: '其他',
}

const STATUS_CONFIG = {
  prospect:  { label: '待接觸', color: 'bg-gray-100 text-gray-600' },
  contacted: { label: '已接觸', color: 'bg-blue-100 text-blue-700' },
  active:    { label: '合作中', color: 'bg-green-100 text-green-700' },
  inactive:  { label: '不跟進', color: 'bg-red-100 text-red-600' },
}

const DISTRICTS = ['全部', '大安區', '北投區', '信義區', '文山區', '士林區', '中山區', '松山區', '萬華區', '內湖區', '大同區', '中正區', '南港區']
const ORG_TYPES = [{ value: '', label: '全部類型' }, ...Object.entries(ORG_TYPE_LABELS).map(([v, label]) => ({ value: v, label }))]
const STATUSES  = [{ value: '', label: '全部狀態' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))]

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.prospect
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
}

function OrgTypeBadge({ type }) {
  const label = ORG_TYPE_LABELS[type] ?? type
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{label}</span>
}

export default function CareStations() {
  const [allRecords, setAllRecords] = useState([])
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes]   = useState('')
  const [editAssigned, setEditAssigned] = useState('')

  const [search,   setSearch]   = useState('')
  const [district, setDistrict] = useState('全部')
  const [orgType,  setOrgType]  = useState('')
  const [status,   setStatus]   = useState('')

  useEffect(() => {
    getCareStations().then(d => {
      setAllRecords(d)
      setRecords(d)
      setLoading(false)
    })
  }, [])

  function handleSearch() {
    const filtered = allRecords.filter(r => {
      if (district !== '全部' && r.district !== district) return false
      if (orgType && r.org_type !== orgType) return false
      if (status  && r.status   !== status)  return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.org_name?.toLowerCase().includes(q) &&
            !r.contact_person?.toLowerCase().includes(q) &&
            !r.phone?.includes(q)) return false
      }
      return true
    })
    setRecords(filtered)
    setSelected(null)
  }

  function handleReset() {
    setSearch(''); setDistrict('全部'); setOrgType(''); setStatus('')
    setRecords(allRecords)
    setSelected(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
  }

  const stats = useMemo(() => ({
    total:     allRecords.length,
    prospect:  allRecords.filter(r => !r.status || r.status === 'prospect').length,
    contacted: allRecords.filter(r => r.status === 'contacted').length,
    active:    allRecords.filter(r => r.status === 'active').length,
  }), [allRecords])

  function openDetail(r) {
    setSelected(r)
    setEditStatus(r.status ?? 'prospect')
    setEditNotes(r.notes ?? '')
    setEditAssigned(r.assigned_to ?? '')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setSaveError('')
    try {
      await updateCareStation(selected.id, {
        status:      editStatus,
        notes:       editNotes,
        assigned_to: editAssigned,
      })
      const updated = { ...selected, status: editStatus, notes: editNotes, assigned_to: editAssigned }
      setAllRecords(prev => prev.map(r => r.id === selected.id ? updated : r))
      setRecords(prev => prev.map(r => r.id === selected.id ? updated : r))
      setSelected(updated)
    } catch (err) {
      setSaveError(err.message ?? '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">關懷站資訊</h1>
        <p className="text-sm text-gray-400 mt-1">台北市社區關懷服務據點 · 共 {allRecords.length} 個單位</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '總據點', value: stats.total,     color: 'text-gray-700',  bg: 'bg-gray-50' },
          { label: '待接觸', value: stats.prospect,  color: 'text-gray-600',  bg: 'bg-gray-50' },
          { label: '已接觸', value: stats.contacted, color: 'text-blue-700',  bg: 'bg-blue-50' },
          { label: '合作中', value: stats.active,    color: 'text-green-700', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-gray-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="搜尋單位名稱、聯絡人、電話..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select value={district} onChange={e => setDistrict(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={orgType} onChange={e => setOrgType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSearch}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Search className="w-4 h-4" /> 查詢
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" /> 清除
          </button>
          <span className="text-sm text-gray-400 ml-1">顯示 {records.length} 筆</span>
        </div>
      </div>

      {/* Table + Detail panel */}
      <div className="flex gap-4">
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 ${selected ? 'hidden md:block' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs">單位名稱</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-500 text-xs">行政區</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-500 text-xs hidden md:table-cell">類型</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-500 text-xs hidden lg:table-cell">聯絡人</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-500 text-xs hidden lg:table-cell">電話</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-500 text-xs">狀態</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => openDetail(r)}
                    className={`border-b border-gray-50 hover:bg-green-50/40 cursor-pointer transition-colors ${
                      selected?.id === r.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-gray-800 leading-snug line-clamp-2">{r.org_name}</p>
                      {r.assigned_to && <p className="text-xs text-gray-400 mt-0.5">負責：{r.assigned_to}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{r.district}</td>
                    <td className="py-2.5 px-3 hidden md:table-cell"><OrgTypeBadge type={r.org_type} /></td>
                    <td className="py-2.5 px-3 text-gray-600 hidden lg:table-cell">{r.contact_person}</td>
                    <td className="py-2.5 px-3 text-gray-500 hidden lg:table-cell text-xs">{r.phone}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={r.status ?? 'prospect'} /></td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">
                      {allRecords.length === 0 ? '載入中...' : '沒有符合條件的據點，請調整篩選條件後再查詢'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full md:w-80 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <h3 className="text-sm font-semibold text-gray-800 leading-snug">{selected.org_name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{selected.district} · <OrgTypeBadge type={selected.org_type} /></span>
              </div>
              {selected.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{selected.address}</span>
                </div>
              )}
              {selected.contact_person && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>{selected.contact_person}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{selected.phone}</span>
                </div>
              )}
              {selected.villages && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 shrink-0">服務村里：</span>
                  <span className="leading-relaxed">{selected.villages}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">接觸狀態</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">負責人員</label>
                <input value={editAssigned} onChange={e => setEditAssigned(e.target.value)}
                  placeholder="輸入負責業務姓名"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">備註</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="拜訪紀錄、聯絡狀況..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
              </div>
              {saveError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
