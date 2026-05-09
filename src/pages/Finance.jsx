import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Download, Mail, AlertCircle, Loader2, Plus, X } from 'lucide-react'
import { useAudit } from '../contexts/AuditContext'
import { getLunchRecords, addLunchRecord, getCourseFinanceRecords, updateEnrollmentPaid, updateFinanceRecord } from '../services/api/finance'

function getStatus(r) {
  if (r.amount_paid >= r.amount_due) return { label: '已繳', icon: '✅', cls: 'bg-green-50 text-green-700' }
  if (r.amount_paid > 0) return { label: `部分繳費（欠${r.amount_due - r.amount_paid}元）`, icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
  const month = r.month ? new Date(r.month + '-01') : null
  const now = new Date()
  if (month && month < new Date(now.getFullYear(), now.getMonth(), 1))
    return { label: '逾期', icon: '🔴', cls: 'bg-red-50 text-red-700' }
  return { label: '未繳', icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
}

const emptyLunch = { member_name: '', amount_due: 0, amount_paid: 0, month: new Date().toISOString().slice(0, 7) }

export default function Finance() {
  const { addLog } = useAudit()
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('all')
  const [emailSent, setEmailSent]   = useState(false)
  const [showLunchForm, setShowLunchForm] = useState(false)
  const [lunchForm, setLunchForm]   = useState(emptyLunch)
  const [saving, setSaving]         = useState(false)
  const [editPay, setEditPay]       = useState(null) // { record, value }

  const load = useCallback(async () => {
    setLoading(true)
    const [lunch, course] = await Promise.all([getLunchRecords(), getCourseFinanceRecords()])
    setRecords([...course, ...lunch])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const courseNames = [...new Set(records.filter(r => r.type === 'course' && r.course_name).map(r => r.course_name))]
  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'lunch', label: '🍱 午餐費' },
    ...courseNames.map(name => ({ key: `course:${name}`, label: `📚 ${name}` })),
  ]

  const filtered = records.filter(r => {
    if (view === 'all') return true
    if (view === 'lunch') return r.type === 'lunch'
    if (view.startsWith('course:')) return r.course_name === view.replace('course:', '')
    return true
  })

  const totalDue   = filtered.reduce((s, r) => s + (r.amount_due ?? 0), 0)
  const totalPaid  = filtered.reduce((s, r) => s + (r.amount_paid ?? 0), 0)
  const totalOwed  = totalDue - totalPaid
  const unpaidList = filtered.filter(r => r.amount_paid < r.amount_due)

  async function handleAddLunch(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addLunchRecord({
        member_name: lunchForm.member_name,
        type: 'lunch',
        month: lunchForm.month,
        amount_due: Number(lunchForm.amount_due),
        amount_paid: Number(lunchForm.amount_paid),
      })
      addLog({ action: '新增', module: '財務追蹤', target: lunchForm.member_name, detail: `新增午餐費 ${lunchForm.amount_due} 元` })
      setLunchForm(emptyLunch)
      setShowLunchForm(false)
      await load()
    } catch (err) { alert(`新增失敗：${err.message}`) }
    finally { setSaving(false) }
  }

  async function handleSavePay(r) {
    const newPaid = Number(editPay.value) || 0
    try {
      if (r.enrollment_id) {
        await updateEnrollmentPaid(r.enrollment_id, newPaid)
      } else {
        await updateFinanceRecord(r.id, { amount_paid: newPaid })
      }
      addLog({ action: '修改', module: '財務追蹤', target: r.member_name, detail: `更新繳費 ${newPaid} 元` })
      setEditPay(null)
      await load()
    } catch (err) { alert(`更新失敗：${err.message}`) }
  }

  function exportCSV() {
    const rows = [['姓名', '類型', '課程', '月份', '應收', '已收', '差額', '狀態']]
    records.forEach(r => {
      const s = getStatus(r)
      rows.push([r.member_name, r.type === 'lunch' ? '午餐費' : '課程費',
        r.course_name ?? '', r.month, r.amount_due, r.amount_paid,
        r.amount_due - r.amount_paid, s.label])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = '財務收支明細.csv'; a.click()
    addLog({ action: '匯出', module: '財務追蹤', target: '財務收支明細.csv', detail: `匯出 ${records.length} 筆` })
  }

  function handleEmailAlert() {
    setEmailSent(true)
    addLog({ action: '發送通知', module: '財務追蹤', target: 'AI 欠費通知', detail: `發送 ${unpaidList.length} 筆欠費通知` })
    setTimeout(() => setEmailSent(false), 4000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">財務追蹤</h1>
          <p className="text-sm text-gray-400 mt-1">課程費自動同步報名資料・午餐費手動建立</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setShowLunchForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> 新增午餐費
          </button>
          <button onClick={handleEmailAlert}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-medium shadow-sm">
            <Mail className="w-4 h-4" /> 發送欠費通知
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
            <Download className="w-4 h-4" /> 匯出 CSV
          </button>
        </div>
      </div>

      {/* 新增午餐費表單 */}
      {showLunchForm && (
        <form onSubmit={handleAddLunch} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">新增午餐費記錄</h3>
            <button type="button" onClick={() => setShowLunchForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">長者姓名 *</label>
              <input required value={lunchForm.member_name}
                onChange={e => setLunchForm(p => ({ ...p, member_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">月份</label>
              <input type="month" value={lunchForm.month}
                onChange={e => setLunchForm(p => ({ ...p, month: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">應收金額（元）</label>
              <input type="number" value={lunchForm.amount_due}
                onChange={e => setLunchForm(p => ({ ...p, amount_due: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">已收金額（元）</label>
              <input type="number" value={lunchForm.amount_paid}
                onChange={e => setLunchForm(p => ({ ...p, amount_paid: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} 新增
            </button>
            <button type="button" onClick={() => setShowLunchForm(false)}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      {emailSent && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <Mail className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-amber-700 font-semibold text-sm">
            已發送欠費通知 · 共 {unpaidList.length} 筆，總欠費 {totalOwed.toLocaleString()} 元
          </p>
        </div>
      )}

      {unpaidList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">待追繳（{unpaidList.length} 筆）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unpaidList.map(r => (
              <span key={r.id} className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full">
                {r.member_name} 欠 {r.amount_due - r.amount_paid} 元
              </span>
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
                const s = getStatus(r)
                const diff = r.amount_due - r.amount_paid
                const isEditing = editPay?.record.id === r.id
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-800">{r.member_name}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {r.type === 'lunch' ? '🍱 午餐費' : `📚 ${r.course_name ?? '課程費'}`}
                    </td>
                    <td className="py-3 px-3 text-right">{r.amount_due} 元</td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input type="number" value={editPay.value}
                            onChange={e => setEditPay(p => ({ ...p, value: e.target.value }))}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary" />
                          <button onClick={() => handleSavePay(r)} className="text-xs text-primary font-medium hover:underline">存</button>
                          <button onClick={() => setEditPay(null)} className="text-xs text-gray-400 hover:underline">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditPay({ record: r, value: String(r.amount_paid) })}
                          className="text-green-600 hover:underline cursor-pointer">
                          {r.amount_paid} 元
                        </button>
                      )}
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
    </div>
  )
}
