import { useState } from 'react'
import { BookOpen, Users, Calculator, Download } from 'lucide-react'
import { mockCourses, mockEnrollments, mockMembers } from '../services/mockData'
import { calcProRatedFee } from '../utils/billing'

export default function Courses() {
  const [courses] = useState(mockCourses)
  const [enrollments] = useState(mockEnrollments)
  const [calcInput, setCalcInput] = useState({ totalFee: 200, totalSessions: 4, remaining: 2 })
  const fee = calcProRatedFee(calcInput.totalFee, calcInput.totalSessions, calcInput.remaining)

  function getEnrolled(courseId) {
    return enrollments.filter(e => e.course_id === courseId)
  }

  function exportCSV() {
    const rows = [['學員', '課程', '剩餘堂數', '應繳金額', '繳費狀態']]
    enrollments.forEach(e => {
      const course = courses.find(c => c.id === e.course_id)
      const proratedFee = calcProRatedFee(course.total_fee, course.total_sessions, e.sessions_remaining)
      rows.push([e.member_name, course.name, e.sessions_remaining, proratedFee, e.paid ? '已繳' : '未繳'])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '課程報名名單.csv'
    a.click()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">課程管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {courses.length} 堂課程</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> 匯出 CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> 動態按比例計費計算機
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">課程總費用（元）</label>
            <input type="number" value={calcInput.totalFee}
              onChange={e => setCalcInput(p => ({ ...p, totalFee: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">總堂數</label>
            <input type="number" value={calcInput.totalSessions}
              onChange={e => setCalcInput(p => ({ ...p, totalSessions: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">剩餘堂數</label>
            <input type="number" value={calcInput.remaining}
              onChange={e => setCalcInput(p => ({ ...p, remaining: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-green-700">應付金額 = {calcInput.totalFee} ÷ {calcInput.totalSessions} × {calcInput.remaining}</p>
          <span className="text-2xl font-bold text-primary">{fee} 元</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {courses.map(c => {
          const isFull = c.enrolled >= c.capacity
          const enrolled = getEnrolled(c.id)
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  <p className="text-xs text-gray-400">{c.session} 場 · {c.day} {c.time} · {c.instructor}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {isFull ? '額滿' : `剩 ${c.capacity - c.enrolled} 名`}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{c.total_fee} 元 / {c.total_sessions} 堂</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>報名人數</span>
                  <span>{c.enrolled} / {c.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${isFull ? 'bg-red-400' : 'bg-primary'}`}
                    style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
                </div>
              </div>
              <button disabled={isFull}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light'}`}>
                {isFull ? '名額已滿' : '報名此課程'}
              </button>
              {enrolled.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> 已報名學員
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {enrolled.map(e => (
                      <span key={e.id} className={`text-xs px-2 py-0.5 rounded-full ${e.paid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {e.member_name} {e.paid ? '✓' : '未繳'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
