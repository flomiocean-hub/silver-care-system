import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X, Clock, User, BookOpen, Loader2 } from 'lucide-react'
import { getCourses } from '../services/api/courses'

const DAY_MAP = { '週日':0, '週一':1, '週二':2, '週三':3, '週四':4, '週五':5, '週六':6 }
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function getCourseDatesInMonth(course, year, month) {
  if (!course.start_date) return []
  const start = new Date(course.start_date + 'T00:00:00')

  if (course.total_sessions === 1) {
    if (start.getFullYear() === year && start.getMonth() + 1 === month) {
      return [start.getDate()]
    }
    return []
  }

  const targetDay = DAY_MAP[course.day]
  if (targetDay === undefined) return []

  const results = []
  let d = new Date(start)
  for (let i = 0; i < course.total_sessions; i++) {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    if (y > year || (y === year && m > month)) break
    if (y === year && m === month) results.push(d.getDate())
    const next = new Date(d)
    next.setDate(next.getDate() + 7)
    d = next
  }
  return results
}

function buildCalendarWeeks(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const weeks = []
  let week = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

export default function Schedule() {
  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getCourses().then(data => { setCourses(data); setLoading(false) })
  }, [])

  function prevMonth() {
    setSelected(null)
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    setSelected(null)
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month])

  const dayCoursesMap = useMemo(() => {
    const map = {}
    for (const course of courses) {
      for (const d of getCourseDatesInMonth(course, year, month)) {
        if (!map[d]) map[d] = []
        map[d].push(course)
      }
    }
    // 上午排前面
    for (const d in map) {
      map[d].sort((a, b) => {
        if (a.time === '上午' && b.time !== '上午') return -1
        if (a.time !== '上午' && b.time === '上午') return 1
        return 0
      })
    }
    return map
  }, [courses, year, month])

  const totalThisMonth = useMemo(
    () => Object.values(dayCoursesMap).reduce((s, arr) => s + arr.length, 0),
    [dayCoursesMap]
  )

  const isToday = d => d && now.getFullYear() === year &&
    now.getMonth() + 1 === month && now.getDate() === d

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> 課程月曆
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {year} 年 {month} 月 · 共 {totalThisMonth} 堂課
          </p>
        </div>
        {/* 圖例 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-green-300 inline-block" /> 上午
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-300 inline-block" /> 下午
          </span>
        </div>
      </div>

      {/* 月曆主體 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* 月份導航 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-gray-800">
            {year} 年 {month} 月
          </span>
          <button onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 星期標題列 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={label} className={`py-2 text-center text-xs font-semibold tracking-wide ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}>
              {label}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
            {week.map((day, di) => {
              const dayCourses = day ? (dayCoursesMap[day] ?? []) : []
              const showLimit  = 3
              const overflow   = dayCourses.length - showLimit
              return (
                <div key={di} className={`
                  min-h-[80px] md:min-h-[100px] p-1 md:p-1.5
                  border-r border-gray-50 last:border-0
                  ${!day ? 'bg-gray-50/50' : 'hover:bg-green-50/20 transition-colors'}
                `}>
                  {day && (
                    <>
                      {/* 日期數字 */}
                      <div className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                        ${isToday(day)
                          ? 'bg-primary text-white'
                          : di === 0 ? 'text-red-400'
                          : di === 6 ? 'text-blue-400'
                          : 'text-gray-600'}
                      `}>
                        {day}
                      </div>

                      {/* 課程標籤 */}
                      <div className="space-y-0.5">
                        {dayCourses.slice(0, showLimit).map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelected(s => s?.id === c.id ? null : c)}
                            className={`
                              w-full text-left text-[10px] md:text-[11px] px-1 md:px-1.5 py-0.5 rounded
                              leading-4 truncate transition-colors
                              ${c.time === '上午'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}
                              ${selected?.id === c.id
                                ? 'ring-1 ' + (c.time === '上午' ? 'ring-green-500' : 'ring-amber-500')
                                : ''}
                            `}
                          >
                            {c.name}
                          </button>
                        ))}
                        {overflow > 0 && (
                          <p className="text-[10px] text-gray-400 px-1 leading-4">
                            +{overflow} 堂
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 課程詳情面板 */}
      {selected && (
        <div className="bg-white rounded-xl border border-primary/30 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-semibold text-gray-800">{selected.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                selected.time === '上午'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {selected.time}
              </span>
              {selected.total_sessions > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  系列課程
                </span>
              )}
            </div>
            <button onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {selected.instructor && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{selected.instructor}</span>
              </div>
            )}
            {selected.day && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{selected.day} {selected.time}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              <span>共 {selected.total_sessions} 堂</span>
            </div>
          </div>

          {selected.description && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              {selected.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
