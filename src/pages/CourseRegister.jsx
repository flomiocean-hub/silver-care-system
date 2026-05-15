import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Clock, User, Users, BookOpen, CheckCircle, AlertCircle, MapPin, DollarSign, Loader2, Phone, X } from 'lucide-react'
import { getCourses, getEnrollments, addEnrollment, updateCourseCount } from '../services/api/courses'
import { getMembersByIds, findMembersByName, updateMemberPhone } from '../services/api/members'
import { useAuth } from '../contexts/AuthContext'

export default function CourseRegister() {
  const { courseId } = useParams()
  const { user }     = useAuth()
  const [course, setCourse]         = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [memberMap, setMemberMap]   = useState({})
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [submitted, setSubmitted]     = useState(null)
  const [error, setError]             = useState('')
  const [contactCard, setContactCard] = useState(null)
  const [phoneConfirm, setPhoneConfirm] = useState(null)

  useEffect(() => {
    async function load() {
      const [courses, enrs] = await Promise.all([getCourses(), getEnrollments()])
      const course = courses.find(c => c.id === courseId) ?? null
      const filtered = enrs.filter(e => e.course_id === courseId)
      setCourse(course)
      setEnrollments(filtered)

      if (user) {
        const memberIds = [...new Set(filtered.map(e => e.member_id).filter(Boolean))]
        if (memberIds.length > 0) {
          const members = await getMembersByIds(memberIds)
          setMemberMap(Object.fromEntries(members.map(m => [m.id, m])))
        }
      }
      setLoading(false)
    }
    load()
  }, [courseId, user])

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

  async function performEnroll(memberId, memberName, enrollPhone) {
    const waitlistNo = isFull ? waitlist.length + 1 : null
    await addEnrollment({
      member_id:          memberId,
      member_name:        memberName,
      phone:              enrollPhone || null,
      course_id:          courseId,
      sessions_remaining: course.total_sessions,
      total_paid:         0,
      total_fee:          course.total_fee,
      is_waitlist:        isFull,
      waitlist_no:        waitlistNo,
    })
    await updateCourseCount(courseId, isFull ? 'waitlist' : 'enrolled', 1)
    setSubmitted({ type: isFull ? 'waitlist' : 'enrolled', no: waitlistNo })
    setSaving(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('請填寫姓名'); return }

    const alreadyIn = enrollments.find(en => en.member_name?.trim() === name.trim())
    if (alreadyIn) { setError('此姓名已報名，請聯繫據點確認'); return }

    setSaving(true)

    const matches = await findMembersByName(name.trim(), course.org_id)

    if (matches.length === 0) {
      await performEnroll(null, name.trim(), phone.trim())
      return
    }

    if (matches.length >= 2) {
      // 同名多筆：以電話再次比對
      const byPhone = matches.find(m => m.mobile && phone.trim() && m.mobile === phone.trim())
      if (byPhone) {
        await performEnroll(byPhone.id, byPhone.name, phone.trim())
      } else {
        await performEnroll(null, name.trim(), phone.trim())
      }
      return
    }

    // 單一比對
    const member = matches[0]
    const memberPhone = member.mobile ?? ''
    const inputPhone  = phone.trim()

    if (!memberPhone && inputPhone) {
      await updateMemberPhone(member.id, member.org_id, inputPhone)
      await performEnroll(member.id, member.name, inputPhone)
    } else if (!inputPhone || memberPhone === inputPhone) {
      await performEnroll(member.id, member.name, inputPhone || memberPhone)
    } else {
      setSaving(false)
      setPhoneConfirm({ member, newPhone: inputPhone })
    }
  }

  async function handlePhoneConfirmYes() {
    if (!phoneConfirm) return
    setSaving(true)
    await updateMemberPhone(phoneConfirm.member.id, phoneConfirm.member.org_id, phoneConfirm.newPhone)
    await performEnroll(phoneConfirm.member.id, phoneConfirm.member.name, phoneConfirm.newPhone)
    setPhoneConfirm(null)
  }

  async function handlePhoneConfirmNo() {
    if (!phoneConfirm) return
    setSaving(true)
    await performEnroll(phoneConfirm.member.id, phoneConfirm.member.name, phoneConfirm.member.mobile)
    setPhoneConfirm(null)
  }

  function maskPhone(p) {
    if (!p || p.length < 4) return p
    return p.slice(0, -3) + '***'
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
          {user && (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 mb-3 inline-flex items-center gap-1">
              <Phone className="w-3 h-3" /> 點擊姓名可查看聯絡資料
            </p>
          )}
          {enrolled.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">尚無人報名，成為第一位！</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {enrolled.map((e, i) => {
                const member = memberMap[e.member_id]
                const hasContact = user && (member?.mobile || member?.home_phone || e.phone)
                return (
                  <div key={e.id}
                    onClick={() => hasContact && setContactCard({ enrollment: e, member })}
                    className={`flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 ${hasContact ? 'cursor-pointer hover:bg-green-100 active:scale-95 transition-all' : ''}`}>
                    <span className="text-xs text-green-400 font-mono w-4 shrink-0">{i + 1}</span>
                    <span className="text-sm text-green-800 font-medium truncate">{e.member_name}</span>
                    {hasContact && <Phone className="w-3 h-3 text-green-400 shrink-0 ml-auto" />}
                  </div>
                )
              })}
            </div>
          )}
          {waitlist.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-amber-600 font-semibold mb-2">後補名單</p>
              <div className="grid grid-cols-3 gap-2">
                {waitlist.map(e => {
                  const member = memberMap[e.member_id]
                  const hasContact = user && (member?.mobile || member?.home_phone || e.phone)
                  return (
                    <div key={e.id}
                      onClick={() => hasContact && setContactCard({ enrollment: e, member })}
                      className={`flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 ${hasContact ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''}`}>
                      <span className="text-xs text-amber-400 font-mono w-6 shrink-0">後{e.waitlist_no}</span>
                      <span className="text-sm text-amber-800 truncate">{e.member_name}</span>
                      {hasContact && <Phone className="w-3 h-3 text-amber-400 shrink-0 ml-auto" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 聯絡資訊 Popup */}
          {contactCard && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
              onClick={() => setContactCard(null)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{contactCard.enrollment.member_name}</h3>
                  <button onClick={() => setContactCard(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-3">
                  {(contactCard.member?.mobile || contactCard.member?.home_phone || contactCard.enrollment.phone) ? (
                    <>
                      {(contactCard.member?.mobile || contactCard.enrollment.phone) && (
                        <a href={`tel:${contactCard.member?.mobile ?? contactCard.enrollment.phone}`}
                          className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                          <Phone className="w-4 h-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">手機</p>
                            <p className="text-sm font-medium text-gray-800">
                              {contactCard.member?.mobile ?? contactCard.enrollment.phone}
                            </p>
                          </div>
                        </a>
                      )}
                      {contactCard.member?.home_phone && (
                        <a href={`tel:${contactCard.member.home_phone}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">家用電話</p>
                            <p className="text-sm font-medium text-gray-800">{contactCard.member.home_phone}</p>
                          </div>
                        </a>
                      )}
                      {contactCard.member?.emergency_contact && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                          <Phone className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-red-400 font-medium">緊急聯絡人</p>
                            <p className="text-sm text-gray-700">{contactCard.member.emergency_contact}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">此學員未留聯絡電話</p>
                  )}
                </div>
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

      {phoneConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">電話號碼不同</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              您輸入的電話
              <span className="font-semibold text-gray-800 mx-1">{phoneConfirm.newPhone}</span>
              與上次登記的電話
              <span className="font-semibold text-gray-800 mx-1">{maskPhone(phoneConfirm.member.mobile)}</span>
              不同。<br />是否要更新聯絡電話？
            </p>
            <div className="flex gap-3">
              <button
                onClick={handlePhoneConfirmYes}
                disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                是，更新電話
              </button>
              <button
                onClick={handlePhoneConfirmNo}
                disabled={saving}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-50">
                否，維持原電話
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
