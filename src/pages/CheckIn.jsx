import { useState } from 'react'
import { Search, CheckCircle, Upload, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { mockMembers, mockTodayCheckins, mockHealthData } from '../services/mockData'
import { getBPStatus, checkWeightAlert } from '../utils/riskScoring'
import { useAudit } from '../contexts/AuditContext'
import { askGeminiOCR, hasGemini } from '../services/geminiService'

export default function CheckIn() {
  const { addLog } = useAudit()
  const [query, setQuery] = useState('')
  const [checkins, setCheckins] = useState(mockTodayCheckins)
  const [selected, setSelected] = useState(null)
  const [vitals, setVitals] = useState({ systolic: '', diastolic: '', pulse: '', weight: '' })
  const [showSuccess, setShowSuccess] = useState(false)
  const [ocrFile, setOcrFile] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [weightAlert, setWeightAlert] = useState(null)

  const filtered = query
    ? mockMembers.filter(m =>
        (m.name.includes(query) || m.id.includes(query)) &&
        !checkins.find(c => c.member_id === m.id)
      )
    : []

  function handleSelect(m) {
    setSelected(m)
    setQuery(m.name)
    setOcrResult(null)
    setWeightAlert(null)
  }

  function handleVitalChange(field, value) {
    setVitals(p => ({ ...p, [field]: value }))
    if (field === 'weight' && selected && value) {
      const alert = checkWeightAlert(selected, mockHealthData)
      setWeightAlert(alert)
    }
  }

  function handleCheckin() {
    if (!selected) return
    const newEntry = {
      id: `A${Date.now()}`,
      member_id: selected.id,
      name: selected.name,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      systolic: vitals.systolic || '-',
      diastolic: vitals.diastolic || '-',
      pulse: vitals.pulse || '-',
      weight: vitals.weight || '-',
    }
    setCheckins(prev => [newEntry, ...prev])
    addLog({
      action: '簽到',
      module: '數位簽到',
      target: selected.name,
      detail: vitals.systolic
        ? `血壓 ${vitals.systolic}/${vitals.diastolic} mmHg・脈搏 ${vitals.pulse || '—'}・體重 ${vitals.weight || '—'} kg`
        : '無生理數據',
    })
    setShowSuccess(true)
    setSelected(null)
    setQuery('')
    setVitals({ systolic: '', diastolic: '', pulse: '', weight: '' })
    setOcrResult(null)
    setWeightAlert(null)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  async function handleOCR(e) {
    const file = e.target.files[0]
    if (!file) return
    setOcrFile(file.name)
    setOcrResult(null)
    setOcrLoading(true)

    if (hasGemini) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const result = await askGeminiOCR(base64, file.type)
        setOcrLoading(false)
        if (result && (result.systolic || result.diastolic)) {
          setOcrResult(result)
          setVitals(p => ({
            ...p,
            systolic:  result.systolic  ?? p.systolic,
            diastolic: result.diastolic ?? p.diastolic,
            pulse:     result.pulse     ?? p.pulse,
          }))
        } else {
          setOcrResult({ error: true })
        }
      }
      reader.readAsDataURL(file)
    } else {
      // 展示模式：模擬辨識
      setTimeout(() => {
        const result = { systolic: 138, diastolic: 86, pulse: 74 }
        setOcrResult(result)
        setVitals(p => ({ ...p, systolic: result.systolic, diastolic: result.diastolic, pulse: result.pulse }))
        setOcrLoading(false)
      }, 1200)
    }
  }

  const bpStatus = vitals.systolic && selected
    ? getBPStatus(Number(vitals.systolic), Number(vitals.diastolic), selected.gender)
    : null

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">數位簽到</h1>
        <p className="text-sm text-gray-400 mt-1">搜尋姓名後輸入生理數據完成簽到</p>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-green-700 font-semibold">簽到成功！</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">搜尋長者姓名</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="輸入姓名…"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
              />
            </div>
            {filtered.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                {filtered.map(m => (
                  <li key={m.id}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center hover:bg-green-50 transition-colors ${selected?.id === m.id ? 'bg-green-50 border-l-4 border-primary' : ''}`}
                    onClick={() => handleSelect(m)}>
                    <div>
                      <span className="font-medium text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{m.id}</span>
                    </div>
                    <div className="flex gap-1">
                      {m.tags.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-600">輸入生理數據（選填）</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'systolic', label: '收縮壓', unit: 'mmHg' },
                    { key: 'diastolic', label: '舒張壓', unit: 'mmHg' },
                    { key: 'pulse', label: '脈搏', unit: 'bpm' },
                    { key: 'weight', label: '體重', unit: 'kg' },
                  ].map(({ key, label, unit }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500">{label}</label>
                      <input type="number" placeholder={unit} value={vitals[key]}
                        onChange={e => handleVitalChange(key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  ))}
                </div>

                {bpStatus && (
                  <div className={`p-3 rounded-lg text-sm ${bpStatus.bg}`}>
                    <span className="font-medium">血壓判讀：</span>
                    <span className={`font-bold ${bpStatus.color}`}>{bpStatus.label}</span>
                    <span className="text-gray-500 text-xs ml-2">（依台灣中高齡{selected.gender}性基準）</span>
                  </div>
                )}

                {weightAlert && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-red-600">體重警示：近期下降 {weightAlert.drop} kg，請追蹤健康狀況</span>
                  </div>
                )}

                <button onClick={handleCheckin}
                  className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary-light active:scale-95 transition-all shadow-md">
                  ✓ 確認簽到 — {selected.name}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" /> OCR 辨識（拍攝血壓計畫面）
            </p>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{ocrFile ?? '點擊上傳 / 拍攝血壓計圖片'}</p>
              <p className="text-xs text-gray-400 mt-1">系統自動擷取收縮壓、舒張壓、脈搏 · 影像自動壓縮節省空間</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleOCR} />
            </label>
            {ocrLoading && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                <span className="text-blue-600">{hasGemini ? 'Gemini 辨識中…' : '辨識中…'}</span>
              </div>
            )}
            {ocrResult && !ocrResult.error && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="font-medium text-green-700 mb-1">
                  ✓ OCR 辨識完成{hasGemini ? '（Gemini）' : '（模擬）'}
                </p>
                <p className="text-green-600">
                  收縮壓 {ocrResult.systolic ?? '—'} / 舒張壓 {ocrResult.diastolic ?? '—'} mmHg · 脈搏 {ocrResult.pulse ?? '—'} bpm
                </p>
                <p className="text-xs text-green-500 mt-1">數值已自動填入，如有誤差可手動修正</p>
              </div>
            )}
            {ocrResult?.error && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="text-amber-700">無法辨識圖片中的數值，請確認圖片清晰度或手動輸入</p>
              </div>
            )}
            {!selected && (
              <p className="text-xs text-gray-400 mt-2 text-center">請先搜尋並選擇長者再進行 OCR</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 今日已簽到（{checkins.length} 人）
          </h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {checkins.map(c => {
              const member = mockMembers.find(m => m.member_id === c.member_id || m.id === c.member_id)
              const bp = c.systolic !== '-'
                ? getBPStatus(Number(c.systolic), Number(c.diastolic), member?.gender ?? '女')
                : null
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.systolic !== '-' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${bp?.bg} ${bp?.color}`}>
                            {c.systolic}/{c.diastolic} {bp?.label}
                          </span>
                        )}
                        {c.pulse !== '-' && <span className="text-xs text-gray-400">脈搏 {c.pulse}</span>}
                        {c.weight !== '-' && <span className="text-xs text-gray-400">{c.weight}kg</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{c.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
