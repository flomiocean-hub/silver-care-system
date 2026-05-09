import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Calculator, Download, Plus, Wallet, Clock, Link, Check, Loader2, Trash2 } from 'lucide-react'
import { calcProRatedFee } from '../utils/billing'
import { useAudit } from '../contexts/AuditContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/layout/ConfirmDialog'
import { getCourses, addCourse, getEnrollments, addEnrollment, updateCourseCount, deleteCourse } from '../services/api/courses'

const emptyForm = {
  name: '', session: 'A', instructor: '', description: '', expected_outcome: '',
  day: '週一', time: '09:00', start_date: '', capacity: 25,
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [copiedId, setCopiedId]       = useState(null)
  const [calcInput, setCalcInput]   = useState({ totalFee: 200, totalSessions: 4, remaining: 2 })
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [enrollModal, setEnrollModal] = useState(null)
  const [enrollName, setEnrollName] = useState('')
  const [enrollPaid, setEnrollPaid] = useState('')
  const [adminOverride, setAdminOverride] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [c, e] = await Promise.all([getCourses(), getEnrollments()])
    setCourses(c)
    setEnrollments(e)
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
    if (!enrollName.trim() || !enrollModal) return
    const course = courses.find(c => c.id === enrollModal)
    const existing = enrollments.find(e => e.course_id === enrollModal && e.member_name === enrollName.trim())
    if (existing) return

    const isFull = course.enrolled >= course.capacity
    const isPastStart = course.start_date && new Date() > new Date(course.start_date)
    if (isPastStart && !adminOverride) return

    const waitlistCount = getWaitlist(enrollModal).length
    const newEntry = {
      member_id: null,
      member_name: enrollName.trim(),
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
      target: `${enrollName.trim()} → ${course.name}`,
      detail: isFull ? `加入候補名單（後補${waitlistCount + 1}）` : `完成報名・繳費 ${Number(enrollPaid) || 0} 元`,
    })
    setEnrollModal(null)
    setEnrollName('')
    setEnrollPaid('')
    setAdminOverride(false)
    await load()
    setSaving(false)
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
      {deleteTarget && (
        <ConfirmDialog
          title={`確定要刪除「${deleteTarget.name}」嗎？`}
          message="課程及所有報名記錄將一併移除，此操作無法復原。"
          onConfirm={confirmDeleteCourse}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-gray-700">報名課程</h3>
            <div>
              <label className="text-xs text-gray-500 block mb-1">長者姓名（全名）</label>
              <input value={enrollName} onChange={e => setEnrollName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="輸入姓名，系統自動比對" autoFocus />
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
              <button onClick={handleEnroll} disabled={saving}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} 確認報名
              </button>
              <button onClick={() => { setEnrollModal(null); setEnrollName(''); setEnrollPaid('') }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">課程管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {courses.length} 堂課程</p>
        </div>
        <div className="flex gap-2">
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
              { key: 'day', label: '上課日', req: false },
              { key: 'time', label: '時間', req: false, type: 'time' },
              { key: 'start_date', label: '開課日期', req: false, type: 'date' },
              { key: 'capacity', label: '名額上限', req: false, type: 'number' },
              { key: 'total_sessions', label: '總堂數', req: false, type: 'number' },
              { key: 'total_fee', label: '每人費用（元）', req: false, type: 'number' },
              { key: 'materials_fee', label: '材料費預算（元）', req: false, type: 'number' },
            ].map(({ key, label, req, type }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input required={req} type={type || 'text'} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">課程內容說明</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">預期參與成效</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c => {
          const enrolled = getEnrolled(c.id)
          const waitlist = getWaitlist(c.id)
          const isFull = c.enrolled >= c.capacity
          const materialsRemaining = c.materials_fee - c.materials_spent

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
                    <button onClick={() => setDeleteTarget(c)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
                    <Wallet className="w-3 h-3" /> 材料費專案帳
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>預算 {c.materials_fee} 元</span>
                    <span>已用 {c.materials_spent} 元</span>
                    <span className={materialsRemaining < 0 ? 'text-red-600 font-bold' : ''}>
                      餘額 {materialsRemaining} 元
                    </span>
                  </div>
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
                      const diff = e.total_fee - e.total_paid
                      return (
                        <span key={e.id} className={`text-xs px-2 py-0.5 rounded-full ${
                          diff === 0 ? 'bg-green-50 text-green-700' :
                          diff === e.total_fee ? 'bg-red-50 text-red-600' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {e.member_name}
                          {diff > 0 ? ` (欠${diff})` : ' ✓'}
                        </span>
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
                      <span key={e.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        後補{e.waitlist_no} {e.member_name}
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
