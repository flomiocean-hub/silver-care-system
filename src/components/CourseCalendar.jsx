import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, User, BookOpen, CalendarDays } from 'lucide-react'

const DAY_MAP = { '週日':0, '週一':1, '週二':2, '週三':3, '週四':4, '週五':5, '週六':6 }
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// 台灣國定假日（含2025–2026）
const TAIWAN_HOLIDAYS = {
  '2025-01-01': '元旦',
  '2025-01-28': '農曆除夕',
  '2025-01-29': '春節',
  '2025-01-30': '春節',
  '2025-01-31': '春節',
  '2025-02-01': '春節',
  '2025-02-02': '春節',
  '2025-02-03': '春節',
  '2025-02-28': '和平紀念日',
  '2025-04-04': '兒童節・清明',
  '2025-05-01': '勞動節',
  '2025-05-31': '端午節',
  '2025-10-06': '中秋節',
  '2025-10-10': '國慶日',
  '2026-01-01': '元旦',
  '2026-02-16': '農曆除夕',
  '2026-02-17': '春節',
  '2026-02-18': '春節',
  '2026-02-19': '春節',
  '2026-02-20': '春節',
  '2026-02-21': '春節',
  '2026-02-22': '春節',
  '2026-02-28': '和平紀念日',
  '2026-04-04': '兒童節・清明',
  '2026-05-01': '勞動節',
  '2026-06-19': '端午節',
  '2026-10-03': '中秋節',
  '2026-10-10': '國慶日',
}

function getCourseDatesInMonth(course, year, month) {
  if (!course.start_date) return []
  const start = new Date(course.start_date + 'T00:00:00')

  if (course.total_sessions === 1) {
    if (start.getFullYear() === year && start.getMonth() + 1 === month)
      return [start.getDate()]
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

function pad(n) { return String(n).padStart(2, '0') }

export default function CourseCalendar({ courses }) {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [selected, setSelected] = useState(null)

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

  function getHoliday(day) {
    if (!day) return null
    return TAIWAN_HOLIDAYS[`${year}-${pad(month)}-${pad(day)}`] ?? null
  }

  return (
    <div className="space-y-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-gray-500">
            {year} 年 {month} 月 · 共 {totalThisMonth} 堂課
          </p>
          <p className="text-xs text-gray-400 mt-0.5">※ 課程實際開課與否，以現場管理者通知為準</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-green-300 inline-block" /> 上午
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-300 inline-block" /> 下午
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-200 inline-block" /> 國定假日
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

        {/* 星期標題 */}
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
              const holiday = getHoliday(day)
              const showLimit = 2
              const overflow = dayCourses.length - showLimit
              return (
                <div key={di} className={`
                  min-h-[80px] md:min-h-[100px] p-1 md:p-1.5
                  border-r border-gray-50 last:border-0
                  ${!day ? 'bg-gray-50/50' : holiday ? 'bg-red-50/40' : 'hover:bg-green-50/20 transition-colors'}
                `}>
                  {day && (
                    <>
                      <div className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-0.5
                        ${isToday(day)
                          ? 'bg-primary text-white'
                          : di === 0 ? 'text-red-400'
                          : di === 6 ? 'text-blue-400'
                          : 'text-gray-600'}
                      `}>
                        {day}
                      </div>

                      {holiday && (
                        <p className="text-[9px] text-red-400 leading-3 truncate px-0.5 mb-0.5 font-medium">
                          {holiday}
                        </p>
                      )}

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
                          <p className="text-[10px] text-gray-400 px-1 leading-4">+{overflow} 堂</p>
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
                selected.time === '上午' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {selected.time}
              </span>
              {selected.total_sessions > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">系列課程</span>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
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
