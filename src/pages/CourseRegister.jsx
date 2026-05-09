import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Clock, User, Users, BookOpen, CheckCircle, AlertCircle, MapPin, DollarSign, Loader2 } from 'lucide-react'
import { getCourses, getEnrollments, addEnrollment, updateCourseCount } from '../services/api/courses'

export default function CourseRegister() {
  const { courseId } = useParams()
  const [course, setCourse]         = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [submitted, setSubmitted]   = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function load() {
      const [courses, enrs] = await Promise.all([getCourses(), getEnrollments()])
      setCourse(courses.find(c => c.id === courseId) ?? null)
      setEnrollments(enrs.filter(e => e.course_id === courseId))
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-medium">找不到此課程</p>
          <p className="text-sm mt-1">請確認連結是否正確</p>
        </div>
      </div>
    )
  }

  const enrolled  = enrollments.filter(e => !e.is_waitlist)
  const waitlist  = enrollments.filter(e => e.is_waitlist).sort((a, b) => a.waitlist_no - b.waitlist_no)
  const remaining = course.capacity - enrolled.length
  const isFull    = remaining <= 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('請填寫姓名'); return }

    const alreadyIn = enrollments.find(en => en.member_name?.trim() === name.trim())
    if (alreadyIn) { setError('此姓名已報名，請聯繫據點確認'); return }

    setSaving(true)
    const waitlistNo = isFull ? waitlist.length + 1 : null
    await addEnrollment({
      member_id: null,
      member_name: name.trim(),
      course_id: courseId,
      sessions_remaining: course.total_sessions,
      total_paid: 0,
      total_fee: course.total_fee,
      is_waitlist: isFull,
      waitlist_no: waitlistNo,
    })
    await updateCourseCount(courseId, isFull ? 'waitlist' : 'enrolled', 1)
    setSubmitted({ type: isFull ? 'waitlist' : 'enrolled', no: waitlistNo })
    setSaving(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          {submitted.type === 'enrolled' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">報名成功！</h2>
              <p className="text-gray-500 text-sm mb-4">
                <span className="font-semibold text-gray-700">{name}</span> 已完成報名
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm space-y-1">
                <p className="font-semibold text-green-700">{course.name}（{course.session} 場）</p>
                <p className="text-green-600">{course.day} {course.time} · {course.instructor}</p>
                <p className="text-green-600">費用：{course.total_fee} 元 / {course.total_sessions} 堂</p>
              </div>
              <p className="text-xs text-gray-400 mt-4">請至現場繳費，完成報名確認</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">已列入後補名單</h2>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold text-gray-700">{name}</span> 為第
                <span className="text-2xl font-bold text-amber-500 mx-1">{submitted.no}</span>
                位候補
              </p>
              <p className="text-xs text-gray-400 mt-4">如有名額釋出，據點將主動聯繫您</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-primary text-white px-4 py-6 text-center">
        <p className="text-green-200 text-xs mb-1">關懷據點 · 課程報名</p>
        <h1 className="text-2xl font-bold">{course.name}</h1>
        <p className="text-green-200 text-sm mt-1">{course.session} 場</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> 課程資訊
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{course.day}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{course.time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{course.total_fee} 元 / {course.total_sessions} 堂</span>
            </div>
            {course.start_date && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>開課日期：{course.start_date}</span>
              </div>
            )}
          </div>
          {course.description && (
            <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
              {course.description}
            </p>
          )}
          {course.expected_outcome && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-green-700 mb-1">預期成效</p>
              <p className="text-xs text-green-600 leading-relaxed">{course.expected_outcome}</p>
            </div>
          )}
        </div>

        <div className={`rounded-2xl shadow-sm border p-5 ${isFull ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 ${isFull ? 'text-amber-500' : 'text-green-600'}`} />
              <span className={`font-semibold text-sm ${isFull ? 'text-amber-700' : 'text-green-700'}`}>
                {isFull ? `名額已滿・後補名單 ${waitlist.length} 人` : `尚有名額`}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${isFull ? 'text-amber-500' : 'text-primary'}`}>
                {isFull ? waitlist.length : remaining}
              </span>
              <span className="text-xs text-gray-400 ml-1">{isFull ? '位候補' : '名額'}</span>
            </div>
          </div>
          <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
            <div className={`h-2.5 rounded-full transition-all ${isFull ? 'bg-amber-400' : 'bg-primary'}`}
              style={{ width: `${Math.min((enrolled.length / course.capacity) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            已報名 {enrolled.length} / 上限 {course.capacity} 人
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            已報名學員（{enrolled.length} 人）
          </h2>
          {enrolled.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">尚無人報名，成為第一位！</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {enrolled.map((e, i) => (
                <div key={e.id} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <span className="text-xs text-green-400 font-mono w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm text-green-800 font-medium truncate">{e.member_name}</span>
                </div>
              ))}
            </div>
          )}
          {waitlist.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-amber-600 font-semibold mb-2">後補名單</p>
              <div className="grid grid-cols-3 gap-2">
                {waitlist.map(e => (
                  <div key={e.id} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <span className="text-xs text-amber-400 font-mono w-6 shrink-0">後{e.waitlist_no}</span>
                    <span className="text-sm text-amber-800 truncate">{e.member_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">
            {isFull ? '加入後補名單' : '立即報名'}
          </h2>
          {isFull && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-600">
              課程名額已滿，您的報名將自動列入後補名單。如有名額釋出，據點將主動通知您。
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">您的姓名 <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="請輸入真實姓名"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">聯絡電話（選填）</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="09XX-XXX-XXX"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-4 bg-primary text-white text-base font-bold rounded-xl hover:bg-primary-light active:scale-95 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? '送出中…' : isFull ? '加入後補名單' : '確認報名'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            費用請至現場繳交 · 報名後如需取消請聯繫據點
          </p>
        </form>
      </div>

      <div className="text-center py-6 text-xs text-gray-300">
        銀髮關懷據點智慧管理系統
      </div>
    </div>
  )
}
