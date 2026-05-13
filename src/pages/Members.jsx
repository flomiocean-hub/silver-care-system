import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, Trash2, Edit3, Phone, MapPin, User, Loader2, ShieldCheck, ShieldAlert, Printer } from 'lucide-react'
import { getRiskLevel } from '../utils/riskScoring'
import { toRocDate, rocToIso } from '../utils/dateUtils'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'
import { useAudit } from '../contexts/AuditContext'
import { getMembers, addMember, updateMember, deleteMember } from '../services/api/members'
import { getEnrollmentSummary } from '../services/api/courses'
import { printConsentForm } from '../utils/printConsent'
import { getOrgName } from '../config/org'
import MemberDrawer from '../components/members/MemberDrawer'

const TAG_COLORS = {
  '獨居':     'bg-orange-100 text-orange-700',
  '今日出席': 'bg-green-100 text-green-700',
  '探訪':     'bg-purple-100 text-purple-700',
  '電訪追蹤': 'bg-blue-100 text-blue-700',
  '久未出席': 'bg-gray-100 text-gray-600',
  '久未參與': 'bg-amber-100 text-amber-700',
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
function isLongAbsent(last_seen) {
  if (!last_seen) return true
  return Date.now() - new Date(last_seen).getTime() > FOURTEEN_DAYS_MS
}

function getSixMonthsAgo() {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().slice(0, 10)
}

function isLongInactive(member, lastEnrollmentMap) {
  const cutoff = getSixMonthsAgo()
  const lastCheckin  = member.last_seen ?? ''
  const lastEnrolled = (lastEnrollmentMap[member.id] ?? '').slice(0, 10)
  const lastActivity = lastCheckin > lastEnrolled ? lastCheckin : lastEnrolled
  return !lastActivity || lastActivity < cutoff
}

const MEMBER_TYPES   = ['出席型', '探訪型']
const AVAILABLE_TAGS = ['獨居', '電訪追蹤', '探訪']
const FILTER_OPTIONS = [
  { key: 'all',           label: '全部' },
  { key: 'active',        label: '定期參與' },
  { key: 'inactive',      label: '久未參與' },
  { key: 'alone',         label: '獨居' },
  { key: 'high',          label: '高風險' },
  { key: 'absent',        label: '久未出席' },
  { key: 'visit',         label: '探訪型' },
  { key: 'phone',         label: '電訪追蹤' },
  { key: 'no_consent',    label: '未簽同意書' },
]

function generateId(members) {
  const max = members.reduce((m, mb) => {
    const n = parseInt(mb.id.split('-')[1] || '0')
    return n > m ? n : m
  }, 0)
  return `SC-${String(max + 1).padStart(3, '0')}`
}

const emptyForm = {
  name: '', birthday: '', gender: '女', mobile: '', home_phone: '', address: '',
  emergency_contact: '', member_type: '出席型', tags: [], notes: '',
  consent_signed: false, consent_signed_at: null,
}

export default function Members() {
  const { isAdmin }  = useAuth()
  const { addLog }   = useAudit()
  const [members, setMembers]                   = useState([])
  const [lastEnrollmentMap, setLastEnrollmentMap] = useState({})
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [query, setQuery]                       = useState('')
  const [filter, setFilter]                     = useState('all')
  const [showForm, setShowForm]                 = useState(false)
  const [deleteTarget, setDeleteTarget]         = useState(null)
  const [form, setForm]                         = useState(emptyForm)
  const [selectedMember, setSelectedMember]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [memberData, enrollmentData] = await Promise.all([getMembers(), getEnrollmentSummary()])
    setMembers(memberData)
    const map = {}
    for (const e of enrollmentData) {
      const date = (e.enrolled_at ?? '').slice(0, 10)
      if (!map[e.member_id] || date > map[e.member_id]) map[e.member_id] = date
    }
    setLastEnrollmentMap(map)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = members.filter(m => {
    const q = !query || m.name.includes(query)
    const f =
      filter === 'all'        ? true :
      filter === 'active'     ? !isLongInactive(m, lastEnrollmentMap) :
      filter === 'inactive'   ? isLongInactive(m, lastEnrollmentMap) :
      filter === 'alone'      ? m.tags?.includes('獨居') :
      filter === 'high'       ? m.risk_score >= 70 :
      filter === 'absent'     ? isLongAbsent(m.last_seen) :
      filter === 'visit'      ? m.member_type === '探訪型' :
      filter === 'phone'      ? m.tags?.includes('電訪追蹤') :
      filter === 'no_consent' ? !m.consent_signed : true
    return q && f
  })

  const noConsentCount = members.filter(m => !m.consent_signed).length

  function toggleTag(tag) {
    setForm(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag] }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const newMember = {
      ...form,
      id: generateId(members),
      join_date: new Date().toISOString().slice(0, 10),
      last_seen: new Date().toISOString().slice(0, 10),
      risk_score: form.tags.includes('獨居') ? 30 : 5,
      status: '活躍',
      weight_baseline: null,
    }
    await addMember(newMember)
    addLog({ action: '新增', module: '長者管理', target: `${newMember.name}（${newMember.id}）`, detail: '新增長者基本資料' })
    setForm(emptyForm)
    setShowForm(false)
    await load()
    setSaving(false)
  }

  function startEdit(m) {
    setForm({ ...m, tags: m.tags ?? [] })
    setShowForm('edit')
  }

  async function handleEditSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateMember(form.id, form)
    addLog({ action: '修改', module: '長者管理', target: `${form.name}（${form.id}）`, detail: '修改長者資料' })
    setShowForm(false)
    setForm(emptyForm)
    await load()
    setSaving(false)
  }

  async function confirmDelete() {
    addLog({ action: '刪除', module: '長者管理', target: `${deleteTarget.name}（${deleteTarget.id}）`, detail: '刪除長者資料' })
    await deleteMember(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {deleteTarget && (
        <ConfirmDialog
          title={`確定要刪除「${deleteTarget.name}」的資料嗎？`}
          message="此操作無法復原，長者所有相關資料將一併移除。"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">長者管理</h1>
          <p className="text-sm text-gray-400 mt-1">
            共 {members.length} 位會員
            {noConsentCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {noConsentCount} 位尚未簽同意書</span>
            )}
          </p>
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
              <input required value={form.name ?? ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">生日（西元 或 民國年）</label>
              <input required value={form.birthday ?? ''} placeholder="1949-11-15 或 038/11/15"
                onChange={e => {
                  const v = e.target.value
                  const iso = v.includes('/') ? rocToIso(v) : v
                  setForm(p => ({ ...p, birthday: iso }))
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              {form.birthday && <p className="text-xs text-gray-400 mt-1">{toRocDate(form.birthday)}</p>}
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
            {[
              { key: 'mobile', label: '個人手機', placeholder: '09XX-XXX-XXX' },
              { key: 'home_phone', label: '家裡電話', placeholder: '02-XXXX-XXXX' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input value={form[key] ?? ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            {[
              { key: 'address', label: '通訊地址', full: true },
              { key: 'emergency_contact', label: '緊急聯絡人（姓名 電話）', full: true, placeholder: '王小明 0912-345-678' },
              { key: 'notes', label: '健康備註', full: true },
            ].map(({ key, label, full, placeholder }) => (
              <div key={key} className={full ? 'col-span-2' : ''}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input value={form[key] ?? ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-2">狀態標籤</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button type="button" key={tag} onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.tags?.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-300 hover:border-primary'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">個資使用同意書</p>
                  <p className="text-xs text-gray-400 mt-0.5">長者已簽署書面同意書，同意健康資料用於照護管理</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    consent_signed: !p.consent_signed,
                    consent_signed_at: !p.consent_signed ? new Date().toISOString() : null,
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.consent_signed ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    form.consent_signed ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              {showForm === 'edit' && (
                <button
                  type="button"
                  onClick={() => printConsentForm(form, getOrgName())}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  列印同意書
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {showForm === 'edit' ? '儲存修改' : '新增'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">取消</button>
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => {
            const risk = getRiskLevel(m.risk_score)
            const inactive = isLongInactive(m, lastEnrollmentMap)
            return (
              <div key={m.id}
                className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${risk.border}`}
                onClick={() => setSelectedMember(m)}>
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
                      <p className="text-xs text-gray-400">{m.birthday} · <span className="text-gray-300">{toRocDate(m.birthday)}</span> · {m.gender} · {m.member_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); startEdit(m) }}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(m) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(m.tags ?? []).filter(tag => tag !== '高風險').map(tag => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                  ))}
                  {isLongAbsent(m.last_seen) && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">久未出席</span>
                  )}
                  {inactive && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">久未參與</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.bg} ${risk.text}`}>{risk.label}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {m.mobile && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {m.mobile}
                      {m.home_phone && <span className="text-gray-400">/ {m.home_phone}</span>}
                    </p>
                  )}
                  {m.address && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {m.address}</p>}
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-red-400" />
                    <span className="text-red-500 font-medium">緊急：</span>{m.emergency_contact || '未填寫'}
                  </p>
                  <p>最後出席：{m.last_seen}</p>
                  {m.notes && <p className="text-gray-400 italic">{m.notes}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-1">
                    <div className={`h-1.5 rounded-full ${m.risk_score >= 70 ? 'bg-red-500' : m.risk_score >= 40 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${m.risk_score}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right shrink-0">風險 {m.risk_score}</span>
                  {m.consent_signed ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" /> 已簽
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" /> 未簽
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedMember && (
        <MemberDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
