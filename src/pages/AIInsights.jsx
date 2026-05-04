import { useState } from 'react'
import { Brain, AlertCircle, Activity, MessageSquare, Send, Sparkles, Camera } from 'lucide-react'
import { mockMembers, mockHealthData, HEALTH_NORMS } from '../services/mockData'
import HealthTrendChart from '../components/dashboard/HealthTrendChart'
import { getRiskLevel, getBPStatus, checkWeightAlert } from '../utils/riskScoring'

const AI_RESPONSES = {
  '誰兩週沒來': '依出席記錄分析，連續兩週以上未出席的長者：\n• **張桂英**（SC-005）— 最後出席 2025-04-10，已缺席 23 天，獨居高風險，建議立即電訪\n• **陳美華**（SC-001）— 最後出席 2025-04-18，已缺席 15 天，已列入孤獨死預警名單',
  '午餐費沒繳': '本月午餐費尚未繳費的長者：\n• **吳秀蘭**（SC-007）— 欠費 30 元\n共 1 位，總欠費 30 元。AI 每日定時發送提醒至管理群組。',
  '誰的午餐費': '本月午餐費尚未繳費的長者：\n• **吳秀蘭**（SC-007）— 欠費 30 元\n共 1 位，總欠費 30 元。',
  '血壓偏高': '依台灣中高齡健康基準分析，近期血壓偏高的長者：\n• **陳美華**（SC-001，女）— 收縮壓 148 mmHg，超過女性基準 130 mmHg ↑\n• **吳秀蘭**（SC-007，女）— 收縮壓 162 mmHg，嚴重偏高，血壓震盪 > 30 mmHg ↑↑\n• **王淑芬**（SC-003，女）— 收縮壓 142 mmHg，超過女性基準 ↑\n建議提醒按時服藥並安排血壓複診。',
  default: '您好！我是關懷據點 AI 助理，可幫您查詢出席、血壓、繳費等資訊。\n可試問：「誰兩週沒來了？」、「誰的午餐費還沒繳？」、「這兩天血壓偏高的名單是誰？」',
}

function getAIResponse(query) {
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (key !== 'default' && query.includes(key.slice(0, 5))) return val
  }
  return AI_RESPONSES.default
}

const QUICK_QUERIES = [
  '誰兩週沒來了？',
  '誰的午餐費還沒繳？',
  '這兩天血壓偏高的名單是誰？',
]

const AVATAR_STYLES = ['🧑‍🦳 Q版水彩', '👴 像素風格', '👵 插畫風格', '🎨 油畫風格']

export default function AIInsights() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: AI_RESPONSES.default }
  ])
  const [input, setInput] = useState('')
  const [selectedMember, setSelectedMember] = useState(mockMembers[0])
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStyle, setAvatarStyle] = useState(AVATAR_STYLES[0])
  const [avatarResult, setAvatarResult] = useState(null)
  const [generating, setGenerating] = useState(false)

  const aloneHighRisk = mockMembers.filter(m => m.tags?.includes('獨居') && m.risk_score >= 60)
  const bpAbnormal = mockMembers.filter(m => {
    const health = mockHealthData.filter(h => h.member_id === m.id)
    if (!health.length) return false
    const latest = health[health.length - 1]
    const norm = HEALTH_NORMS[m.gender === '男' ? 'male' : 'female']
    return latest.systolic >= norm.bp_high.systolic || latest.diastolic >= norm.bp_high.diastolic
  })
  const weightAlerts = mockMembers.filter(m => {
    const alert = checkWeightAlert(m, mockHealthData)
    return alert?.alert
  })

  function handleSend() {
    if (!input.trim()) return
    const reply = getAIResponse(input)
    setMessages(p => [...p, { role: 'user', text: input }, { role: 'ai', text: reply }])
    setInput('')
  }

  function handleGenAvatar() {
    if (!avatarFile) return
    setGenerating(true)
    setTimeout(() => {
      setAvatarResult({
        style: avatarStyle,
        emoji: avatarStyle.split(' ')[0],
      })
      setGenerating(false)
    }, 2000)
  }

  function renderAIText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI 關懷洞察
        </h1>
        <p className="text-sm text-gray-400 mt-1">依台灣中高齡（60歲以上）健康基準，性別差異化判定</p>
      </div>

      {/* 預警面板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> 孤獨死預警（{aloneHighRisk.length}）
          </h3>
          <div className="space-y-2">
            {aloneHighRisk.length === 0 ? <p className="text-xs text-gray-400">目前無預警</p> :
              aloneHighRisk.map(m => (
                <div key={m.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-700 text-sm">{m.name}</p>
                      <p className="text-xs text-red-400">最後出席：{m.last_seen}</p>
                      <p className="text-xs text-red-400">緊急：{m.emergency_contact}</p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{m.risk_score}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> 血壓異常（依性別基準）
          </h3>
          <div className="space-y-2">
            {bpAbnormal.length === 0 ? <p className="text-xs text-gray-400">目前無異常</p> :
              bpAbnormal.map(m => {
                const h = mockHealthData.filter(d => d.member_id === m.id).slice(-1)[0]
                const bp = h ? getBPStatus(h.systolic, h.diastolic, m.gender) : null
                const norm = HEALTH_NORMS[m.gender === '男' ? 'male' : 'female']
                return (
                  <div key={m.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-amber-700 text-sm">{m.name} · {m.gender}</p>
                        <p className="text-xs text-amber-500">{h?.systolic}/{h?.diastolic} mmHg · 脈搏 {h?.pulse}</p>
                        <p className="text-xs text-gray-400">基準：{m.gender === '女' ? '130' : '145'} mmHg</p>
                      </div>
                      {bp && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bp.bg} ${bp.color} self-start`}>{bp.label}</span>}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> 體重暴跌警示
          </h3>
          <div className="space-y-2">
            {weightAlerts.length === 0 ? <p className="text-xs text-gray-400">目前無體重異常</p> :
              weightAlerts.map(m => {
                const alert = checkWeightAlert(m, mockHealthData)
                return (
                  <div key={m.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="font-semibold text-purple-700 text-sm">{m.name}</p>
                    <p className="text-xs text-purple-500">近期下降 {alert.drop} kg，建議追蹤</p>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NLP 問答 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 自然語言查詢
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUERIES.map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 bg-green-50 text-primary border border-green-200 rounded-full hover:bg-green-100 transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 max-h-64 overflow-y-auto mb-3 bg-gray-50 rounded-xl p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderAIText(m.text) }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="輸入問題…" className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={handleSend} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 血壓趨勢 + AI Q版 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <label className="text-xs text-gray-500 block mb-2">選擇長者查看血壓趨勢</label>
            <select value={selectedMember.id} onChange={e => setSelectedMember(mockMembers.find(m => m.id === e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-3">
              {mockMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}（{m.gender}）</option>
              ))}
            </select>
          </div>
          <HealthTrendChart data={mockHealthData} memberId={selectedMember.id} memberName={selectedMember.name} />

          {/* AI Q版照片生成（會員專屬功能）*/}
          <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI 轉 Q 版小圖（會員專屬）
            </h3>
            <p className="text-xs text-gray-400 mb-3">上傳長者照片，AI 生成專屬 Q 版形象，增加每日登入趣味！</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {AVATAR_STYLES.map(s => (
                <button key={s} onClick={() => setAvatarStyle(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${avatarStyle === s ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
            <label className="block border-2 border-dashed border-purple-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 transition-colors mb-3">
              <Camera className="w-6 h-6 text-purple-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400">{avatarFile ? `已選擇：${avatarFile}` : '點擊上傳長者照片'}</p>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files[0]) setAvatarFile(e.target.files[0].name); setAvatarResult(null) }} />
            </label>
            <button onClick={handleGenAvatar} disabled={!avatarFile || generating}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                !avatarFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : generating ? 'bg-purple-100 text-purple-400 cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
              {generating ? 'AI 生成中…' : '✨ 生成 Q 版小圖'}
            </button>
            {avatarResult && (
              <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <div className="text-5xl mb-2">{avatarResult.emoji}</div>
                <p className="text-sm font-medium text-purple-700">Q 版生成完成！（{avatarResult.style}）</p>
                <p className="text-xs text-purple-500 mt-1">長者可設為個人頭像，登入即可查看衛教資訊</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
