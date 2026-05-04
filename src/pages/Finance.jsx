import { useState } from 'react'
import { DollarSign, Download, Mail, AlertCircle } from 'lucide-react'
import { mockFinance } from '../services/mockData'

function getStatus(r) {
  if (r.amount_paid >= r.amount_due) return { label: '已繳', icon: '✅', cls: 'bg-green-50 text-green-700' }
  if (r.amount_paid > 0) return { label: `部分繳費（欠${r.amount_due - r.amount_paid}元）`, icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
  const month = new Date(r.month + '-01')
  const now = new Date()
  if (month < new Date(now.getFullYear(), now.getMonth(), 1))
    return { label: '逾期', icon: '🔴', cls: 'bg-red-50 text-red-700' }
  return { label: '未繳', icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' }
}

export default function Finance() {
  const [records] = useState(mockFinance)
  const [view, setView] = useState('all')
  const [emailSent, setEmailSent] = useState(false)

  const filtered = records.filter(r => {
    if (view === 'all') return true
    if (view === 'lunch') return r.type === 'lunch'
    if (view === 'course') return r.type === 'course'
    return true
  })

  const totalDue  = filtered.reduce((s, r) => s + r.amount_due, 0)
  const totalPaid = filtered.reduce((s, r) => s + r.amount_paid, 0)
  const totalOwed = totalDue - totalPaid
  const unpaidList = filtered.filter(r => r.amount_paid < r.amount_due)

  function exportCSV() {
    const rows = [['姓名', '類型', '課程', '月份', '應收', '已收', '差額', '狀態', '日期']]
    records.forEach(r => {
      const s = getStatus(r)
      rows.push([
        r.member_name,
        r.type === 'lunch' ? '午餐費' : '課程費',
        r.course_name ?? '',
        r.month, r.amount_due, r.amount_paid,
        r.amount_due - r.amount_paid,
        s.label, r.date ?? '',
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = '財務收支明細.csv'; a.click()
  }

  function handleEmailAlert() {
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 4000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">財務追蹤</h1>
          <p className="text-sm text-gray-400 mt-1">2025年05月 · 每月1日為費用基準日</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleEmailAlert}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-medium shadow-sm">
            <Mail className="w-4 h-4" /> AI 發送欠費通知
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
            <Download className="w-4 h-4" /> 匯出 CSV
          </button>
        </div>
      </div>

      {emailSent && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <Mail className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-amber-700 font-semibold text-sm">AI 已發送欠費通知至共同管理群組信箱</p>
            <p className="text-amber-600 text-xs mt-0.5">
              共 {unpaidList.length} 筆未繳費記錄，總欠費 {totalOwed} 元 · 接班同仁可即時掌握
            </p>
          </div>
        </div>
      )}

      {unpaidList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">待追繳清單（{unpaidList.length} 筆）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unpaidList.map(r => {
              const diff = r.amount_due - r.amount_paid
              return (
                <span key={r.id} className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full">
                  {r.member_name} 欠 {diff} 元
                </span>
              )
            })}
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
          <div className="flex gap-2">
            {[['all', '全部'], ['lunch', '午餐費'], ['course', '課程費']].map(([val, label]) => (
              <button key={val} onClick={() => setView(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${view === val ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-800">{r.member_name}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {r.type === 'lunch' ? '🍱 午餐費' : `📚 ${r.course_name ?? '課程費'}`}
                    </td>
                    <td className="py-3 px-3 text-right">{r.amount_due} 元</td>
                    <td className="py-3 px-3 text-right text-green-600">{r.amount_paid} 元</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
