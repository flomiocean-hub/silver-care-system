import { useState } from 'react'
import { DollarSign, Download, TrendingUp } from 'lucide-react'
import { mockFinance } from '../services/mockData'

const STATUS = {
  paid: { label: '已繳', icon: '✅', cls: 'bg-green-50 text-green-700' },
  unpaid: { label: '未繳', icon: '⚠️', cls: 'bg-yellow-50 text-yellow-700' },
  overdue: { label: '逾期', icon: '🔴', cls: 'bg-red-50 text-red-700' },
}

function getStatus(record) {
  if (record.paid) return STATUS.paid
  const month = new Date(record.month + '-01')
  const now = new Date()
  return month < new Date(now.getFullYear(), now.getMonth(), 1) ? STATUS.overdue : STATUS.unpaid
}

export default function Finance() {
  const [records] = useState(mockFinance)
  const [view, setView] = useState('monthly')

  const filtered = records.filter(r => r.type === (view === 'monthly' ? 'monthly' : 'meal'))
  const totalDue = filtered.reduce((sum, r) => sum + r.amount, 0)
  const totalPaid = filtered.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0)
  const totalUnpaid = totalDue - totalPaid

  function exportCSV() {
    const rows = [['姓名', '類型', '月份', '金額', '狀態', '繳費日期']]
    records.forEach(r => {
      const s = getStatus(r)
      rows.push([r.member_name, r.type === 'monthly' ? '月費' : '餐費', r.month, r.amount, s.label, r.date ?? ''])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '財務收支明細.csv'
    a.click()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">財務追蹤</h1>
          <p className="text-sm text-gray-400 mt-1">2025年05月</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> 匯出 CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">應收總額</p>
          <p className="text-2xl font-bold text-gray-800">{totalDue.toLocaleString()} <span className="text-sm font-normal text-gray-400">元</span></p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">已收金額</p>
          <p className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} <span className="text-sm font-normal text-gray-400">元</span></p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">待收金額</p>
          <p className="text-2xl font-bold text-amber-500">{totalUnpaid.toLocaleString()} <span className="text-sm font-normal text-gray-400">元</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> 繳費明細
          </h3>
          <div className="flex gap-2">
            {[['monthly','月費制'],['meal','單次餐費']].map(([val, label]) => (
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
                <th className="text-left py-2 px-3">月份</th>
                <th className="text-right py-2 px-3">金額</th>
                <th className="text-center py-2 px-3">狀態</th>
                <th className="text-left py-2 px-3">繳費日期</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = getStatus(r)
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-800">{r.member_name}</td>
                    <td className="py-3 px-3 text-gray-500">{r.month}</td>
                    <td className="py-3 px-3 text-right font-medium">{r.amount} 元</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{r.date ?? '—'}</td>
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
