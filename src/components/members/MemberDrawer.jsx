import { useEffect, useState } from 'react'
import { X, Calendar, Activity, BookOpen, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getMemberCheckins } from '../../services/api/checkins'
import { getMemberEnrollments } from '../../services/api/courses'

function buildMonthCalendar() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    months.push({ label: `${month + 1}月`, key, daysInMonth })
  }
  return months
}

export default function MemberDrawer({ member, onClose }) {
  const [loading, setLoading] = useState(true)
  const [checkins, setCheckins] = useState([])
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    if (!member) return
    setLoading(true)
    Promise.all([
      getMemberCheckins(member.id),
      getMemberEnrollments(member.id),
    ]).then(([c, e]) => {
      setCheckins(c)
      setEnrollments(e)
      setLoading(false)
    })
  }, [member?.id])

  if (!member) return null

  const checkinDateSet = new Set(checkins.map(c => c.checkin_date))
  const months = buildMonthCalendar()

  const bpData = checkins
    .filter(c => c.systolic)
    .map(c => ({
      date: c.checkin_date.slice(5),
      收縮壓: c.systolic,
      舒張壓: c.diastolic,
    }))

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">{member.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {member.id} · {member.gender} · {member.member_type}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

            {/* 簽到月曆 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                近六個月簽到（共 {checkins.length} 次）
              </h3>
              <div className="space-y-2.5">
                {months.map(({ label, key, daysInMonth }) => {
                  const days = Array.from({ length: daysInMonth }, (_, i) => {
                    const dateStr = `${key}-${String(i + 1).padStart(2, '0')}`
                    return checkinDateSet.has(dateStr)
                  })
                  const count = days.filter(Boolean).length
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6 shrink-0">{label}</span>
                      <div className="flex gap-0.5 flex-wrap flex-1">
                        {days.map((attended, i) => (
                          <div
                            key={i}
                            title={`${label}${i + 1}日`}
                            className={`w-3.5 h-3.5 rounded-sm ${attended ? 'bg-green-400' : 'bg-gray-100'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs shrink-0 ml-1 w-10 text-right text-gray-400">
                        {count > 0 ? `${count}次` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 血壓趨勢 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                血壓趨勢（近六個月）
              </h3>
              {bpData.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  尚無量測記錄
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={bpData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={[50, 200]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(v, n) => [`${v} mmHg`, n]}
                    />
                    <ReferenceLine y={140} stroke="#fca5a5" strokeDasharray="3 3" />
                    <ReferenceLine y={90}  stroke="#93c5fd" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="收縮壓" stroke="#ef4444" dot={{ r: 2 }} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="舒張壓" stroke="#3b82f6" dot={{ r: 2 }} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* 課程報名 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                課程報名紀錄
              </h3>
              {enrollments.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  尚無報名記錄
                </div>
              ) : (
                <div className="space-y-2">
                  {enrollments.map(e => (
                    <div key={e.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs font-medium text-gray-700">
                        {e.courses?.name ?? '（課程已刪除）'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        開始：{e.courses?.start_date ?? '—'} · 報名：{e.enrolled_at?.slice(0, 10) ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
