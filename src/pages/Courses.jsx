import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Calculator, Download, Plus, Clock, Link, Check, Loader2, Trash2, X, CalendarDays, Archive, Pencil, Sparkles, ArrowUpDown, Phone } from 'lucide-react'
import { calcProRatedFee } from '../utils/billing'
import { isExpired } from '../utils/courseUtils'
import CourseCalendar from '../components/CourseCalendar'
import ExpiredCourseView from '../components/ExpiredCourseView'
import { askGeminiCourseDescription, askGeminiCourseOutcome, hasGemini } from '../services/geminiService'
import { useAudit } from '../contexts/AuditContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { getCourses, addCourse, updateCourse, getEnrollments, addEnrollment, updateCourseCount, deleteCourse, deleteEnrollment, updateEnrollmentPayment, updateEnrollmentMaterialPaid } from '../services/api/courses'
import { getMembers } from '../services/api/members'

const DAY_OPTIONS  = ['週一','週二','週三','週四','週五','週六','週日']
const TIME_OPTIONS = ['上午','下午']

const emptyForm = {
  name: '', session: 'A', instructor: '', description: '', expected_outcome: '',
  day: '週一', time: '上午', start_date: '', capacity: 25,
  total_fee: 0, total_sessions: 4, materials_fee: 0,
}

export default function Courses() {
  const navigate = useNavigate()
  const { addLog } = useAudit()
  const { isAdmin } = useAuth()
  const [courses, setCourses]         = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [memberModal, setMemberModal]         = useState(null) // { enrollment, course }
  const [payInput, setPayInput]               = useState('')
  const [materialPayInput, setMaterialPayInput] = useState('')
  const [modalSaving, setModalSaving]         = useState(false)
  const [cancelConfirm, setCancelConfirm]     = useState(false)
  const [copiedId, setCopiedId]           = useState(null)
  const [calcInput, setCalcInput]   = useState({ totalFee: 200, totalSessions: 4, remaining: 2 })
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [members, setMembers]             = useState([])
  const [enrollModal, setEnrollModal]     = useState(null)
  const [enrollMember, setEnrollMember]   = useState(null)
  const [memberSearch, setMemberSearch]   = useState('')
  const [enrollPaid, setEnrollPaid]       = useState('')
  const [adminOverride, setAdminOverride] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'calendar' | 'expired'
  const [sortBy, setSortBy] = useState('date_asc')
  const [aiDescLoading, setAiDescLoading]       = useState(false)
  const [aiOutcomeLoading, setAiOutcomeLoading] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [editSaving, setEditSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [c, e, m] = await Promise.all([getCourses(), getEnrollments(), getMembers()])
    setCourses(c)
    setEnrollments(e)
    setMembers(m)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function copyLink(courseId) {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}register/${courseId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(courseId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const fee = calcProRatedFee(calcInput.totalFee, calcInput.totalSessions, calcInput.remaining)

  function getEnrolled(courseId) {
    return enrollments.filter(e => e.course_id === courseId && !e.is_waitlist)
  }
  function getWaitlist(courseId) {
    return enrollments.filter(e => e.course_id === courseId && e.is_waitlist)
      .sort((a, b) => a.waitlist_no - b.waitlist_no)
  }

  async function handleCreateCourse(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const newCourse = {
        id:               `C${Date.now()}`,
        name:             form.name,
        session:          form.session || 'A',
        instructor:       form.instructor || '',
        description:      form.description || '',
        expected_outcome: form.expected_outcome || '',
        day:              form.day || '',
        time:             form.time || '',
        start_date:       form.start_date || null,
        capacity:         Number(form.capacity) || 25,
        total_fee:        Number(form.total_fee) || 0,
        total_sessions:   Number(form.total_sessions) || 4,
        materials_fee:    Number(form.materials_fee) || 0,
        enrolled:         0,
        waitlist:         0,
        materials_spent:  0,
        status:           'active',
      }
      await addCourse(newCourse)
      addLog({ action: '新增', module: '課程管理', target: newCourse.name, detail: `開設新課程（${newCourse.day} ${newCourse.time}・${newCourse.instructor}）` })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      console.error('新增課程失敗:', err)
      alert(`新增失敗：${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleEnroll() {
    if (!enrollMember || !enrollModal) return
    const course = courses.find(c => c.id === enrollModal)
    const existing = enrollments.find(e => e.course_id === enrollModal && e.member_id === enrollMember.id)
    if (existing) return

    const isFull = course.enrolled >= course.capacity
    const isPastStart = course.start_date && new Date() > new Date(course.start_date)
    if (isPastStart && !adminOverride) return

    const waitlistCount = getWaitlist(enrollModal).length
    const newEntry = {
      member_id: enrollMember.id,
      member_name: enrollMember.name,
      course_id: enrollModal,
      sessions_remaining: course.total_sessions,
      total_paid: Number(enrollPaid) || 0,
      total_fee: course.total_fee,
      is_waitlist: isFull,
      waitlist_no: isFull ? waitlistCount + 1 : null,
    }
    setSaving(true)
    await addEnrollment(newEntry)
    await updateCourseCount(enrollModal, isFull ? 'waitlist' : 'enrolled', 1)
    addLog({
      action: '新增',
      module: '課程管理',
      target: `${enrollMember.name} → ${course.name}`,
      detail: isFull ? `加入候補名單（後補${waitlistCount + 1}）` : `完成報名・繳費 ${Number(enrollPaid) || 0} 元`,
    })
    setEnrollModal(null)
    setEnrollMember(null)
    setMemberSearch('')
    setEnrollPaid('')
    setAdminOverride(false)
    await load()
    setSaving(false)
  }

  function openMemberModal(enrollment, course) {
    setMemberModal({ enrollment, course })
    setPayInput(String(enrollment.total_paid ?? 0))
    setMaterialPayInput(String(enrollment.material_paid ?? 0))
    setCancelConfirm(false)
  }

  async function handleUpdatePayment() {
    if (!memberModal) return
    setModalSaving(true)
    try {
      const newPaid = Number(payInput) || 0
      await updateEnrollmentPayment(memberModal.enrollment.id, newPaid)
      addLog({
        action: '修改', module: '課程管理',
        target: `${memberModal.enrollment.member_name} — ${memberModal.course.name}`,
        detail: `繳費更新：${newPaid} 元`,
      })
      await load()
      setMemberModal(null)
    } catch (err) { alert(`更新失敗：${err.message}`) }
    finally { setModalSaving(false) }
  }

  async function handleUpdateMaterialPayment() {
    if (!memberModal) return
    setModalSaving(true)
    try {
      const newPaid = Number(materialPayInput) || 0
      await updateEnrollmentMaterialPaid(memberModal.enrollment.id, newPaid)
      addLog({
        action: '修改', module: '課程管理',
        target: `${memberModal.enrollment.member_name} — ${memberModal.course.name}`,
        detail: `材料費繳費更新：${newPaid} 元`,
      })
      await load()
      setMemberModal(null)
    } catch (err) { alert(`更新失敗：${err.message}`) }
    finally { setModalSaving(false) }
  }

  async function handleCancelEnrollment() {
    if (!memberModal) return
    setModalSaving(true)
    try {
      const { enrollment, course } = memberModal
      await deleteEnrollment(enrollment.id, course.id, enrollment.is_waitlist)
      addLog({
        action: '刪除', module: '課程管理',
        target: `${enrollment.member_name} — ${course.name}`,
        detail: enrollment.is_waitlist ? '取消候補報名' : '取消正取報名',
      })
      await load()
      setMemberModal(null)
    } catch (err) { alert(`取消失敗：${err.message}`) }
    finally { setModalSaving(false) }
  }

  async function confirmDeleteCourse() {
    try {
      await deleteCourse(deleteTarget.id)
      addLog({ action: '刪除', module: '課程管理', target: deleteTarget.name, detail: '刪除課程及所有報名記錄' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      alert(`刪除失敗：${err.message}`)
    }
  }

  async function handleAIDesc(name, instructor, setter) {
    if (!name.trim()) return
    setAiDescLoading(true)
    const text = await askGeminiCourseDescription(name, instructor)
    if (text) setter(p => ({ ...p, description: text }))
    setAiDescLoading(false)
  }

  async function handleAIOutcome(description, setter) {
    if (!description.trim()) return
    setAiOutcomeLoading(true)
    const text = await askGeminiCourseOutcome(description)
    if (text) setter(p => ({ ...p, expected_outcome: text }))
    setAiOutcomeLoading(false)
  }

  function openEdit(course) {
    setEditTarget(course)
    setEditForm({
      name:             course.name        ?? '',
      session:          course.session     ?? 'A',
      instructor:       course.instructor  ?? '',
      description:      course.description ?? '',
      expected_outcome: course.expected_outcome ?? '',
      day:              course.day        ?? '週一',
      time:             course.time       ?? '上午',
      start_date:       course.start_date ?? '',
      capacity:         course.capacity   ?? 25,
      total_sessions:   course.total_sessions ?? 4,
      total_fee:        course.total_fee  ?? 0,
      materials_fee:    course.materials_fee ?? 0,
    })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    try {
      const updates = {
        name:             editForm.name,
        session:          editForm.session || 'A',
        instructor:       editForm.instructor || '',
        description:      editForm.description || '',
        expected_outcome: editForm.expected_outcome || '',
        day:              editForm.day || '',
        time:             editForm.time || '',
        start_date:       editForm.start_date || null,
        capacity:         Number(editForm.capacity) || 25,
        total_sessions:   Number(editForm.total_sessions) || 4,
        total_fee:        Number(editForm.total_fee) || 0,
        materials_fee:    Number(editForm.materials_fee) || 0,
      }
      await updateCourse(editTarget.id, updates)
      addLog({ action: '修改', module: '課程管理', target: editForm.name, detail: `更新課程資訊` })
      setEditTarget(null)
      await load()
    } catch (err) {
      alert(`儲存失敗：${err.message}`)
    } finally {
      setEditSaving(false)
    }
  }

  function exportCSV() {
    const rows = [['學員', '課程', '堂次', '應繳', '已繳', '差額', '後補']]
    enrollments.forEach(e => {
      const course = courses.find(c => c.id === e.course_id)
      if (!course) return
      const diff = e.total_fee - e.total_paid
      rows.push([
        e.member_name, `${course.name}(${course.session})`,
        e.sessions_remaining, e.total_fee, e.total_paid, diff,
        e.is_waitlist ? `後補${e.waitlist_no}` : '正取',
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = '課程報名名單.csv'; a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 編輯課程 Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <form onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">編輯課程</h3>
              <button type="button" onClick={() => setEditTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* 課程名稱 */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">課程名稱 *</label>
                <input required value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 授課老師 */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">授課老師</label>
                <input value={editForm.instructor}
                  onChange={e => setEditForm(p => ({ ...p, instructor: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* A/B 場 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">A/B 場</label>
                <input value={editForm.session}
                  onChange={e => setEditForm(p => ({ ...p, session: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 開課日期 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">開課日期</label>
                <input type="date" value={editForm.start_date}
                  onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 上課日 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">上課日</label>
                <select value={editForm.day}
                  onChange={e => setEditForm(p => ({ ...p, day: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                  {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* 時間 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">時間</label>
                <select value={editForm.time}
                  onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* 名額上限 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">名額上限</label>
                <input type="number" min={1} value={editForm.capacity}
                  onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 總堂數 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">總堂數</label>
                <input type="number" min={1} value={editForm.total_sessions}
                  onChange={e => setEditForm(p => ({ ...p, total_sessions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 報名費 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">每人報名費（元）</label>
                <input type="number" min={0} value={editForm.total_fee}
                  onChange={e => setEditForm(p => ({ ...p, total_fee: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 材料費 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">每人材料費（元）</label>
                <input type="number" min={0} value={editForm.materials_fee}
                  onChange={e => setEditForm(p => ({ ...p, materials_fee: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 課程說明 */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">課程內容說明</label>
                  {hasGemini && (
                    <button type="button"
                      onClick={() => handleAIDesc(editForm.name, editForm.instructor, setEditForm)}
                      disabled={!editForm.name?.trim() || aiDescLoading}
                      className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-purple-600 bg-purple-50 hover:bg-purple-100">
                      {aiDescLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI 建議
                    </button>
                  )}
                </div>
                <textarea rows={2} value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 預期成效 */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">預期參與成效</label>
                  {hasGemini && (
                    <button type="button"
                      onClick={() => handleAIOutcome(editForm.description, setEditForm)}
                      disabled={!editForm.description?.trim() || aiOutcomeLoading}
                      className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-purple-600 bg-purple-50 hover:bg-purple-100">
                      {aiOutcomeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI 建議
                    </button>
                  )}
                </div>
                <textarea rows={2} value={editForm.expected_outcome}
                  onChange={e => setEditForm(p => ({ ...p, expected_outcome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={editSaving}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
                {editSaving && <Loader2 className="w-4 h-4 animate-spin" />} 儲存變更
              </button>
              <button type="button" onClick={() => setEditTarget(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`確定要刪除「${deleteTarget.name}」嗎？`}
          message="課程及所有報名記錄將一併移除，此操作無法復原。"
          onConfirm={confirmDeleteCourse}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 學員管理 Modal */}
      {memberModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">學員管理</h3>
              <button onClick={() => setMemberModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <p className="font-semibold text-gray-800">{memberModal.enrollment.member_name}</p>
              <p className="text-gray-500">{memberModal.course.name}（{memberModal.course.session} 場）</p>
              <p className="text-xs text-gray-400">
                {memberModal.enrollment.is_waitlist
                  ? `候補第 ${memberModal.enrollment.waitlist_no} 位`
                  : '正取學員'}
              </p>
            </div>

            {(() => {
              const m = members.find(m => m.id === memberModal.enrollment.member_id)
              const phone = m?.mobile || memberModal.enrollment.phone
              if (!m && !phone) return null
              return (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">聯絡資料</p>
                  {phone && (
                    <a href={`tel:${phone}`}
                      className="flex items-center gap-3 px-3 py-2 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      <Phone className="w-4 h-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">手機</p>
                        <p className="text-sm font-medium text-gray-800">{phone}</p>
                      </div>
                    </a>
                  )}
                  {m?.home_phone && (
                    <a href={`tel:${m.home_phone}`}
                      className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">家用電話</p>
                        <p className="text-sm font-medium text-gray-800">{m.home_phone}</p>
                      </div>
                    </a>
                  )}
                  {m?.emergency_contact && (
                    <div className="flex items-start gap-3 px-3 py-2 bg-red-50 rounded-xl">
                      <Phone className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-400 font-medium">緊急聯絡人</p>
                        <p className="text-sm text-gray-700">{m.emergency_contact}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 課程費 */}
            {memberModal.course.total_fee > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">課程費</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>應繳</span>
                  <span className="font-medium text-gray-800">{memberModal.course.total_fee} 元</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>已繳</span>
                  <span className={`font-medium ${memberModal.enrollment.total_paid >= memberModal.course.total_fee ? 'text-green-600' : 'text-amber-500'}`}>
                    {memberModal.enrollment.total_paid} 元
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>尚欠</span>
                  <span className="font-medium text-red-500">
                    {Math.max(0, memberModal.course.total_fee - memberModal.enrollment.total_paid)} 元
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">更新課程費已繳（元）</label>
                  <input type="number" value={payInput} onChange={e => setPayInput(e.target.value)}
                    min={0}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <button onClick={handleUpdatePayment} disabled={modalSaving}
                  className="w-full py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
                  {modalSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  儲存課程費
                </button>
              </div>
            )}

            {/* 材料費 */}
            {memberModal.course.materials_fee > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">材料費</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>應繳</span>
                  <span className="font-medium text-gray-800">{memberModal.course.materials_fee} 元</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>已繳</span>
                  <span className={`font-medium ${(memberModal.enrollment.material_paid ?? 0) >= memberModal.course.materials_fee ? 'text-green-600' : 'text-amber-500'}`}>
                    {memberModal.enrollment.material_paid ?? 0} 元
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>尚欠</span>
                  <span className="font-medium text-red-500">
                    {Math.max(0, memberModal.course.materials_fee - (memberModal.enrollment.material_paid ?? 0))} 元
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">更新材料費已繳（元）</label>
                  <input type="number" value={materialPayInput} onChange={e => setMaterialPayInput(e.target.value)}
                    min={0}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <button onClick={handleUpdateMaterialPayment} disabled={modalSaving}
                  className="w-full py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2">
                  {modalSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  儲存材料費
                </button>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              {!cancelConfirm ? (
                <button onClick={() => setCancelConfirm(true)}
                  className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                  取消報名
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-500 text-center">確定要取消 {memberModal.enrollment.member_name} 的報名嗎？</p>
                  <div className="flex gap-2">
                    <button onClick={handleCancelEnrollment} disabled={modalSaving}
                      className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1">
                      {modalSaving && <Loader2 className="w-3 h-3 animate-spin" />}確認取消
                    </button>
                    <button onClick={() => setCancelConfirm(false)}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">保留</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">報名課程</h3>
              <button onClick={() => { setEnrollModal(null); setEnrollMember(null); setMemberSearch(''); setEnrollPaid('') }}
                className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">選擇長者</label>
              {enrollMember ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <span className="text-sm font-medium text-green-800">{enrollMember.name}</span>
                  <button onClick={() => { setEnrollMember(null); setMemberSearch('') }}
                    className="text-green-400 hover:text-green-600 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="輸入姓名搜尋…"
                    autoFocus
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {memberSearch.trim() && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {members.filter(m => m.name.includes(memberSearch.trim())).slice(0, 10).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">找不到符合的長者</p>
                      ) : (
                        members.filter(m => m.name.includes(memberSearch.trim())).slice(0, 10).map(m => (
                          <button key={m.id}
                            onClick={() => { setEnrollMember(m); setMemberSearch('') }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center justify-between">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-gray-400">{m.id}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">現場繳費金額（元）</label>
              <input type="number" value={enrollPaid} onChange={e => setEnrollPaid(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="支援部分繳費" />
            </div>

            {(() => {
              const course = courses.find(c => c.id === enrollModal)
              const isPastStart = course?.start_date && new Date() > new Date(course.start_date)
              return isPastStart ? (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="override" checked={adminOverride} onChange={e => setAdminOverride(e.target.checked)} />
                  <label htmlFor="override" className="text-xs text-amber-600">已過開課日，確認管理者手動新增</label>
                </div>
              ) : null
            })()}

            <div className="flex gap-2">
              <button onClick={handleEnroll} disabled={saving || !enrollMember}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} 確認報名
              </button>
              <button onClick={() => { setEnrollModal(null); setEnrollMember(null); setMemberSearch(''); setEnrollPaid('') }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">課程管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {courses.filter(c => !isExpired(c)).length} 堂進行中</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 檢視切換 */}
          <div className="flex bg-gray-100 rounded-xl p-1 text-sm">
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <BookOpen className="w-3.5 h-3.5" /> 清單
            </button>
            <button onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${view === 'calendar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <CalendarDays className="w-3.5 h-3.5" /> 月曆
            </button>
            <button onClick={() => setView('expired')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${view === 'expired' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <Archive className="w-3.5 h-3.5" /> 過期
            </button>
          </div>
          {view === 'list' && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer">
                <option value="date_asc">開課日期（近→遠）</option>
                <option value="date_desc">開課日期（遠→近）</option>
                <option value="seats">剩餘名額（多→少）</option>
                <option value="enrolled">報名人數（多→少）</option>
              </select>
            </div>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
            <Download className="w-4 h-4" /> 匯出
          </button>
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> 開設課程
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateCourse} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">新增課程</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: '課程名稱 *', req: true },
              { key: 'instructor', label: '授課老師 *', req: true },
              { key: 'session', label: 'A/B 場', req: false },
              { key: 'start_date', label: '開課日期', req: false, type: 'date' },
              { key: 'capacity', label: '名額上限', req: false, type: 'number' },
              { key: 'total_sessions', label: '總堂數', req: false, type: 'number' },
              { key: 'total_fee', label: '每人報名費（元）', req: false, type: 'number' },
              { key: 'materials_fee', label: '每人材料費（元）', req: false, type: 'number' },
            ].map(({ key, label, req, type }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input required={req} type={type || 'text'} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 block mb-1">上課日</label>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">時間</label>
              <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">課程內容說明</label>
                {hasGemini && (
                  <button type="button"
                    onClick={() => handleAIDesc(form.name, form.instructor, setForm)}
                    disabled={!form.name.trim() || aiDescLoading}
                    className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-purple-600 bg-purple-50 hover:bg-purple-100">
                    {aiDescLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI 建議
                  </button>
                )}
              </div>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">預期參與成效</label>
                {hasGemini && (
                  <button type="button"
                    onClick={() => handleAIOutcome(form.description, setForm)}
                    disabled={!form.description.trim() || aiOutcomeLoading}
                    className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-purple-600 bg-purple-50 hover:bg-purple-100">
                    {aiOutcomeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI 建議
                  </button>
                )}
              </div>
              <textarea rows={2} value={form.expected_outcome} onChange={e => setForm(p => ({ ...p, expected_outcome: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} 建立課程
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> 動態按比例計費計算機
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { key: 'totalFee', label: '課程總費用（元）' },
            { key: 'totalSessions', label: '總堂數' },
            { key: 'remaining', label: '剩餘堂數' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={calcInput[key]}
                onChange={e => setCalcInput(p => ({ ...p, [key]: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-green-700">{calcInput.totalFee} ÷ {calcInput.totalSessions} × {calcInput.remaining}</p>
          <span className="text-2xl font-bold text-primary">{fee} 元</span>
        </div>
      </div>

      {view === 'calendar' && <CourseCalendar courses={courses} />}
      {view === 'expired' && <ExpiredCourseView courses={courses} />}

      {view === 'list' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...courses.filter(c => !isExpired(c))].sort((a, b) => {
          if (sortBy === 'date_asc')  return (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999')
          if (sortBy === 'date_desc') return (b.start_date ?? '').localeCompare(a.start_date ?? '')
          if (sortBy === 'seats')     return (b.capacity - b.enrolled) - (a.capacity - a.enrolled)
          if (sortBy === 'enrolled')  return b.enrolled - a.enrolled
          return 0
        }).map(c => {
          const enrolled = getEnrolled(c.id)
          const waitlist = getWaitlist(c.id)
          const isFull = c.enrolled >= c.capacity

          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  <p className="text-xs text-gray-400">{c.session} 場 · {c.day} {c.time} · {c.instructor}</p>
                  {c.start_date && <p className="text-xs text-gray-400">開課：{c.start_date}</p>}
                </div>
                <div className="flex items-start gap-2 shrink-0">
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {isFull ? `額滿` : `剩 ${c.capacity - c.enrolled} 名`}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{c.total_fee} 元 / {c.total_sessions} 堂</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {c.description && <p className="text-xs text-gray-500 mb-2 leading-relaxed">{c.description}</p>}

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>報名進度</span><span>{c.enrolled} / {c.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${isFull ? 'bg-red-400' : 'bg-primary'}`}
                    style={{ width: `${Math.min((c.enrolled / c.capacity) * 100, 100)}%` }} />
                </div>
              </div>

              {c.materials_fee > 0 && (
                <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                  <span className="font-medium text-amber-700">🎨 材料費</span>
                  <span className="text-amber-600 font-medium">每人 {c.materials_fee} 元</span>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <button onClick={() => setEnrollModal(c.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isFull ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                           : 'bg-primary text-white hover:bg-primary-light'
                  }`}>
                  {isFull ? `後補報名（${waitlist.length} 人）` : '現場報名'}
                </button>
                <button onClick={() => copyLink(c.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors bg-white border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                  title="複製報名連結">
                  {copiedId === c.id
                    ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-600 text-xs">已複製</span></>
                    : <><Link className="w-4 h-4" /><span className="text-xs">分享連結</span></>
                  }
                </button>
                <button onClick={() => navigate(`/register/${c.id}`)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  title="預覽報名頁">
                  <span className="text-xs">預覽</span>
                </button>
              </div>

              {enrolled.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> 正取學員
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {enrolled.map(e => {
                      const totalDue  = (e.total_fee ?? 0) + (c.materials_fee ?? 0)
                      const totalPaid = (e.total_paid ?? 0) + (e.material_paid ?? 0)
                      const diff = totalDue - totalPaid
                      return (
                        <button key={e.id} onClick={() => openMemberModal(e, c)}
                          className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-75 transition-opacity ${
                            diff === 0 ? 'bg-green-50 text-green-700' :
                            diff === totalDue ? 'bg-red-50 text-red-600' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                          {e.member_name}
                          {diff > 0 ? ` (欠${diff})` : ' ✓'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {waitlist.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 後補名單
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {waitlist.map(e => (
                      <button key={e.id} onClick={() => openMemberModal(e, c)}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:opacity-75 transition-opacity">
                        後補{e.waitlist_no} {e.member_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>}
    </div>
  )
}
