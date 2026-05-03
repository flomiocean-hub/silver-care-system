import { useState } from 'react'
import { Search, CheckCircle, Upload, Clock } from 'lucide-react'
import { mockMembers, mockTodayCheckins } from '../services/mockData'

export default function CheckIn() {
  const [query, setQuery] = useState('')
  const [checkins, setCheckins] = useState(mockTodayCheckins)
  const [selected, setSelected] = useState(null)
  const [bp, setBp] = useState({ systolic: '', diastolic: '', weight: '' })
  const [showSuccess, setShowSuccess] = useState(false)
  const [ocrFile, setOcrFile] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)

  const filtered = query
    ? mockMembers.filter(m => m.name.includes(query) && !checkins.find(c => c.member_id === m.id))
    : []

  function handleCheckin() {
    if (!selected) return
    const newEntry = {
      id: `A${Date.now()}`,
      member_id: selected.id,
      name: selected.name,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      systolic: bp.systolic || '-',
      diastolic: bp.diastolic || '-',
      weight: bp.weight || '-',
    }
    setCheckins(prev => [newEntry, ...prev])
    setShowSuccess(true)
    setSelected(null)
    setQuery('')
    setBp({ systolic: '', diastolic: '', weight: '' })
    setTimeout(() => setShowSuccess(false), 3000)
  }

  function handleOCR(e) {
    const file = e.target.files[0]
    if (!file) return
    setOcrFile(file.name)
    setTimeout(() => {
      setOcrResult({ systolic: 138, diastolic: 86, weight: 52.1 })
    }, 1200)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">數位簽到</h1>
        <p className="text-sm text-gray-400 mt-1">搜尋姓名後點擊完成簽到</p>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl animate-pulse">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-semibold">簽到成功！</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">搜尋長者姓名</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="輸入姓名…"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
              />
            </div>
            {filtered.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                {filtered.map(m => (
                  <li
                    key={m.id}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center hover:bg-green-50 transition-colors ${selected?.id === m.id ? 'bg-green-50 border-l-4 border-primary' : ''}`}
                    onClick={() => setSelected(m)}
                  >
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-400">{m.is_alone ? '獨居' : ''}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-600">輸入生理數據（選填）</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">收縮壓</label>
                    <input type="number" placeholder="mmHg" value={bp.systolic}
                      onChange={e => setBp(p => ({ ...p, systolic: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">舒張壓</label>
                    <input type="number" placeholder="mmHg" value={bp.diastolic}
                      onChange={e => setBp(p => ({ ...p, diastolic: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">體重</label>
                    <input type="number" placeholder="kg" value={bp.weight}
                      onChange={e => setBp(p => ({ ...p, weight: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <button
                  onClick={handleCheckin}
                  className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary-light active:scale-95 transition-all shadow-md"
                >
                  ✓ 確認簽到 — {selected.name}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" /> OCR 模擬辨識（量測單上傳）
            </p>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{ocrFile ?? '點擊上傳量測單圖片'}</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleOCR} />
            </label>
            {ocrResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="font-medium text-green-700 mb-1">✓ OCR 辨識結果（模擬）</p>
                <p className="text-green-600">收縮壓：{ocrResult.systolic} mmHg ／ 舒張壓：{ocrResult.diastolic} mmHg ／ 體重：{ocrResult.weight} kg</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 今日已簽到（{checkins.length} 人）
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checkins.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      {c.systolic !== '-' ? `BP ${c.systolic}/${c.diastolic}` : '未量測'}
                      {c.weight !== '-' ? ` · ${c.weight}kg` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
