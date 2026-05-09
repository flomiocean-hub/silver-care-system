import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Download, Mail, AlertCircle, Loader2, Plus, X } from 'lucide-react'
import { useAudit } from '../contexts/AuditContext'
import { getLunchRecords, addLunchRecord, getCourseFinanceRecords, updateEnrollmentPaid, updateEnrollmentMaterialPaid, updateFinanceRecord, deleteLunchRecord } from '../services/api/finance'
import { useAuth } from '../contexts/AuthContext'

function getStatus(r) {
  if (r.amount_paid >= r.amount_due) return { label: '已繳', icon: '✅', cls: 'bg-green-50 text-green-700' }
  if (r.amount_paid > 0) return { label: `部分繳費（欠${r.amount_due - r.amount_paid}元）`, icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
  const month = r.month ? new Date(r.month + '-01') : null
  const now = new Date()
  if (month && month < new Date(now.getFullYear(), now.getMonth(), 1))
    return { label: '逾期', icon: '🔴', cls: 'bg-red-50 text-red-700' }
  return { label: '未繳', icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
}

function typeLabel(r) {
  if (r.type === 'lunch')                        return '🍱 午餐費'
  if (r.type === 'material' && !r.is_material)   return '🎨 材料費'
  if (r.is_material)                             return `🎨 材料費（${r.course_name}）`
  return `📚 ${r.course_name ?? '課程費'}`
}

const emptyForm = { member_name: '', type: 'lunch', amount_due: 0, amount_paid: 0, month: new Date().toISOString().slice(0, 7) }

export default function Finance() {
  const { addLog } = useAudit()
  const { user }   = useAuth()
  const [records, setRecords]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('all')
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [saving, setSaving]           = useState(false)
  // 統一收款 modal（所有記錄類型共用）
  const [payModal, setPayModal]       = useState(null)
  const [payInput, setPayInput]       = useState('')
  const [delConfirm, setDelConfirm]   = useState(false)
  const [modalSaving, setModalSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [manual, course] = await Promise.all([getLunchRecords(), getCourseFinanceRecords()])
    setRecords([...course, ...manual])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const courseNames = [...new Set(records.filter(r => r.type === 'course' && r.course_name).map(r => r.course_name))]
  const filterOptions = [
    { key: 'all',      label: '全部' },
    { key: 'lunch',    label: '🍱 午餐費' },
    { key: 'material', label: '🎨 材料費' },
    ...courseNames.map(name => ({ key: `course:${name}`, label: `📚 ${name}` })),
  ]

  const filtered = records.filter(r => {
    if ((r.amount_due ?? 0) === 0) return false
    if (view === 'all') return true
    if (view === 'lunch')    return r.type === 'lunch'
    if (view === 'material') return r.type === 'material' || r.is_material
    if (view.startsWith('course:')) return r.course_name === view.replace('course:', '')
    return true
  })

  const totalDue   = filtered.reduce((s, r) => s + (r.amount_due ?? 0), 0)
  const totalPaid  = filtered.reduce((s, r) => s + (r.amount_paid ?? 0), 0)
  const totalOwed  = totalDue - totalPaid
  const unpaidList = filtered.filter(r => r.amount_paid < r.amount_due)

  function openPayModal(r) {
    setPayModal(r)
    setPayInput(String(r.amount_paid ?? 0))
    setDelConfirm(false)
  }

  async function handleAddRecord(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addLunchRecord({
        member_name: form.member_name,
        type:        form.type,
        month:       form.month,
        amount_due:  Number(form.amount_due),
        amount_paid: Number(form.amount_paid),
      })
      const label = form.type === 'material' ? '材料費' : '午餐費'
      addLog({ action: '新增', module: '財務追蹤', target: form.member_name, detail: `新增${label} ${form.amount_due} 元` })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) { alert(`新增失敗：${err.message}`) }
    finally { setSaving(false) }
  }

  async function handlePaySave() {
    if (!payModal) return
    setModalSaving(true)
    const newPaid = Number(payInput) || 0
    try {
      if (payModal.is_material && payModal.enrollment_id) {
        await updateEnrollmentMaterialPaid(payModal.enrollment_id, newPaid)
        addLog({ action: '修改', module: '財務追蹤', target: payModal.member_name, detail: `材料費收款：${newPaid} 元（${payModal.course_name}）（操作者：${user?.name}）` })
      } else if (payModal.enrollment_id) {
        await updateEnrollmentPaid(payModal.enrollment_id, newPaid)
        addLog({ action: '修改', module: '財務追蹤', target: payModal.member_name, detail: `課程費收款：${newPaid} 元（${payModal.course_name}）（操作者：${user?.name}）` })
      } else {
        await updateFinanceRecord(payModal.id, { amount_paid: newPaid })
        const label = payModal.type === 'material' ? '材料費' : '午餐費'
        addLog({ action: '修改', module: '財務追蹤', target: payModal.member_name, detail: `${label}收款：${newPaid} 元（操作者：${user?.name}）` })
      }
      await load()
      setPayModal(null)
    } catch (err) { alert(`更新失敗：${err.message}`) }
    finally { setModalSaving(false) }
  }

  async function handlePayDelete() {
    if (!payModal) return
    setModalSaving(true)
    try {
      await deleteLunchRecord(payModal.id)
      const label = payModal.type === 'material' ? '材料費' : '午餐費'
      addLog({ action: '刪除', module: '財務追蹤', target: payModal.member_name, detail: `刪除${label}記錄（操作者：${user?.name}，身份：${user?.role}）` })
      await load()
      setPayModal(null)
    } catch (err) { alert(`刪除失敗：${err.message}`) }
    finally { setModalSaving(false) }
  }

  function exportCSV() {
    const rows = [['姓名', '類型', '課程', '月份', '應收', '已收', '差額', '狀態']]
    filtered.forEach(r => {
      const s = getStatus(r)
      rows.push([r.member_name, typeLabel(r), r.course_name ?? '', r.month,
        r.amount_due, r.amount_paid, r.amount_due - r.amount_paid, s.label])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = '財務收支明細.csv'; a.click()
    addLog({ action: '匯出', module: '財務追蹤', target: '財務收支明細.csv', detail: `匯出 ${filtered.length} 筆` })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )

  const isManualRecord = r => (r.type === 'lunch' || r.type === 'material') && !r.is_material

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">財務追蹤</h1>
          <p className="text-sm text-gray-400 mt-1">課程費自動同步報名資料・午餐費／材料費手動建立</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> 新增餐費
          </button>
          <button disabled title="功能尚未開放"
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed">
            <Mail className="w-4 h-4" /> 發送欠費通知
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
            <Download className="w-4 h-4" /> 匯出 CSV
          </button>
        </div>
      </div>

      {/* 新增費用表單 */}
      {showForm && (
        <form onSubmit={handleAddRecord} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">新增費用記錄</h3>
            <button type="button" onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">長者姓名 *</label>
              <input required value={form.member_name}
                onChange={e => setForm(p => ({ ...p, member_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">費用類型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option value="lunch">🍱 午餐費</option>
                <option value="material">🎨 材料費</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">月份</label>
              <input type="month" value={form.month}
                onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">應收金額（元）</label>
              <input type="number" value={form.amount_due}
                onChange={e => setForm(p => ({ ...p, amount_due: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">已收金額（元）</label>
              <input type="number" value={form.amount_paid}
                onChange={e => setForm(p => ({ ...p, amount_paid: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} 新增
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      {unpaidList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">待追繳（{unpaidList.length} 筆）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unpaidList.map(r => (
              <button key={r.id} onClick={() => openPayModal(r)}
                className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full hover:bg-red-50 transition-colors">
                {r.member_name} 欠 {r.amount_due - r.amount_paid} 元
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '應收總額', value: totalDue,  border: 'border-gray-200', text: 'text-gray-800' },
          { label: '已收金額', value: totalPaid, border: 'border-green-200', text: 'text-green-600' },
          { label: '待收金額', value: totalOwed, border: 'border-amber-200', text: 'text-amber-500' },
        ].map(({ label, value, border, text }) => (
          <div key={label} className={`bg-white rounded-xl border shadow-sm p-5 text-center ${border}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${text}`}>{value.toLocaleString()} <span className="text-sm font-normal text-gray-400">元</span></p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> 收費明細
          </h3>
          <div className="flex gap-2 flex-wrap justify-end">
            {filterOptions.map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${view === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left py-2 px-3">姓名</th>
                <th className="text-left py-2 px-3">項目</th>
                <th className="text-right py-2 px-3">應收</th>
                <th className="text-right py-2 px-3">已收</th>
                <th className="text-right py-2 px-3">差額</th>
                <th className="text-center py-2 px-3">狀態</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s    = getStatus(r)
                const diff = r.amount_due - r.amount_paid
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <button onClick={() => openPayModal(r)}
                        className="font-medium text-primary hover:underline text-left">
                        {r.member_name}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{typeLabel(r)}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{r.amount_due} 元</td>
                    <td className="py-3 px-3 text-right">
                      <span className={r.amount_paid > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {r.amount_paid} 元
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-medium ${diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {diff > 0 ? `-${diff} 元` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">目前無資料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 統一收款 Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">收款登錄</h3>
              <button onClick={() => setPayModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
              <p className="font-semibold text-gray-800">{payModal.member_name}</p>
              <p className="text-gray-500">{typeLabel(payModal)}</p>
              {payModal.month && <p className="text-xs text-gray-400">月份：{payModal.month}</p>}
            </div>

            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">應收</span>
              <span className="font-medium text-gray-800">{payModal.amount_due} 元</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-500">尚欠</span>
              <span className={`font-medium ${payModal.amount_due - payModal.amount_paid > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {Math.max(0, payModal.amount_due - payModal.amount_paid)} 元
              </span>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">更新已收金額（元）</label>
              <input type="number" value={payInput} onChange={e => setPayInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus />
            </div>

            <button onClick={handlePaySave} disabled={modalSaving}
              className="w-full py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2 mb-3">
              {modalSaving && <Loader2 className="w-4 h-4 animate-spin" />} 確認收款
            </button>

            {/* 刪除：僅手動建立的記錄（午餐費 / 手動材料費）才顯示 */}
            {isManualRecord(payModal) && (
              !delConfirm ? (
                <button onClick={() => setDelConfirm(true)}
                  className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100">
                  刪除此筆記錄
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-700 font-medium mb-1">確認刪除？此操作將記錄至審計日誌。</p>
                  <p className="text-xs text-red-500 mb-3">操作者：{user?.name}（{user?.role}）</p>
                  <div className="flex gap-2">
                    <button onClick={handlePayDelete} disabled={modalSaving}
                      className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-60">
                      確認刪除
                    </button>
                    <button onClick={() => setDelConfirm(false)}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                      取消
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
