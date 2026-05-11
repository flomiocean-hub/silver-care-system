import { useState, useEffect, useMemo } from 'react'
import { Archive, BookOpen, CalendarDays, Users, Loader2 } from 'lucide-react'
import { getCourses } from '../services/api/courses'
import { isExpired, getLastDate } from '../utils/courseUtils'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatLastDate(course) {
  const last = getLastDate(course)
  if (!last) return '—'
  return `${last.getMonth() + 1}/${last.getDate()}`
}

export default function ExpiredCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState(null)

  useEffect(() => {
    getCourses().then(data => { setCourses(data); setLoading(false) })
  }, [])

  const expiredCourses = useMemo(() => courses.filter(isExpired), [courses])

  const availableMonths = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const c of expiredCourses) {
      if (!c.start_date) continue
      const d = new Date(c.start_date + 'T00:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ year: d.getFullYear(), month: d.getMonth() + 1, key })
      }
    }
    result.sort((a, b) => b.key.localeCompare(a.key))
    return result
  }, [expiredCourses])

  const activeKey = selectedKey ?? availableMonths[0]?.key ?? null

  const filtered = useMemo(() => {
    if (!activeKey) return []
    const [y, m] = activeKey.split('-').map(Number)
    return expiredCourses.filter(c => {
      if (!c.start_date) return false
      const d = new Date(c.start_date + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() + 1 === m
    })
  }, [expiredCourses, activeKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-400" /> 過期課程
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            依開課月份查詢 · 共 {expiredCourses.length} 筆歷史記錄
          </p>
        </div>

        {availableMonths.length > 0 && (
          <select
            value={activeKey ?? ''}
            onChange={e => setSelectedKey(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            {availableMonths.map(({ year, month, key }) => (
              <option key={key} value={key}>
                {year} 年 {month} 月
              </option>
            ))}
          </select>
        )}
      </div>

      {expiredCourses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">目前沒有過期課程</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">此月份沒有過期課程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-600">{c.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[c.session && `${c.session} 場`, c.day, c.time, c.instructor].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium shrink-0">
                  已結束
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>
                    {formatDate(c.start_date)}
                    {c.total_sessions > 1 && ` — ${formatLastDate(c)}`}
                    （共 {c.total_sessions} 堂）
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>報名 {c.enrolled ?? 0} / {c.capacity} 人</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
