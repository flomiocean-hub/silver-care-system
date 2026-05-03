import { useState } from 'react'
import { Brain, AlertCircle, Activity, MessageSquare, Send } from 'lucide-react'
import { mockMembers, mockHealthData, mockAttendance } from '../services/mockData'
import HealthTrendChart from '../components/dashboard/HealthTrendChart'
import { getRiskLevel } from '../utils/riskScoring'

const AI_RESPONSES = {
  '本週誰還沒繳餐費': '根據系統資料，本週尚未繳餐費的長者有：**王淑芬**、**張桂英**、**吳秀蘭**，共 3 位，合計待收 90 元。建議優先聯繫張桂英（高風險），確認其狀況。',
  '哪幾位阿姨最近兩週沒來': '最近 14 天未出席的女性長者：**張桂英**（最後出席 2025-04-10，已連續缺席 23 天）、**陳美華**（最後出席 2025-04-18，已 15 天）。張桂英為獨居高風險，建議立即關懷訪視。',
  '血壓偏高的長者有哪些': '收縮壓 > 140 mmHg 的長者：\n• **陳美華**（M001）：最新記錄 152/95，呈上升趨勢 ⚠️\n• **吳秀蘭**（M007）：血壓震盪明顯，近三次記錄差異 > 30 mmHg ⚠️\n建議提醒其按時服藥並複診。',
  default: '根據目前資料分析，系統持續監控 8 位長者的出席率、血壓及繳費狀態。如需特定查詢，請嘗試：「本週誰還沒繳餐費」或「血壓偏高的長者有哪些」。',
}

function getAIResponse(query) {
  for (const key of Object.keys(AI_RESPONSES)) {
    if (key !== 'default' && query.includes(key.slice(0, 6))) return AI_RESPONSES[key]
  }
  return AI_RESPONSES.default
}

export default function AIInsights() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: '您好！我是關懷據點 AI 助理。我可以幫您查詢長者出席狀況、血壓異常、未繳費名單等資訊。請輸入您的問題。' }
  ])
  const [input, setInput] = useState('')
  const [selectedMember, setSelectedMember] = useState(mockMembers[0])

  const aloneHighRisk = mockMembers.filter(m => m.is_alone && m.risk_score >= 60)
  const bpAbnormal = mockMembers.filter(m => {
    const health = mockHealthData.filter(h => h.member_id === m.id)
    const latest = health.slice(-1)[0]?.systolic ?? 0
    return latest > 140
  })

  function handleSend() {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input }
    const aiMsg = { role: 'ai', text: getAIResponse(input) }
    setMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI 關懷洞察
        </h1>
        <p className="text-sm text-gray-400 mt-1">智慧分析長者健康與出席狀況</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> 孤獨死預警名單（獨居 + 高風險）
          </h3>
          {aloneHighRisk.length === 0 ? (
            <p className="text-sm text-gray-400">目前無預警名單</p>
          ) : aloneHighRisk.map(m => {
            const risk = getRiskLevel(m.risk_score)
            return (
              <div key={m.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg mb-2 border border-red-100">
                <div>
                  <p className="font-semibold text-red-700 text-sm">{m.name}</p>
                  <p className="text-xs text-red-400">最後出席：{m.last_seen} · 獨居</p>
                  <p className="text-xs text-red-400">緊急聯絡：{m.emergency_contact}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{m.risk_score}</p>
                  <p className="text-xs text-red-400">風險分</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> 血壓異常追蹤
          </h3>
          {bpAbnormal.length === 0 ? (
            <p className="text-sm text-gray-400">目前無血壓異常紀錄</p>
          ) : bpAbnormal.map(m => {
            const health = mockHealthData.filter(h => h.member_id === m.id).slice(-1)[0]
            return (
              <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2 border border-amber-100">
                <div>
                  <p className="font-semibold text-amber-700 text-sm">{m.name}</p>
                  <p className="text-xs text-amber-500">最新測量：{health?.systolic}/{health?.diastolic} mmHg</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">收縮壓偏高</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 自然語言查詢
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['本週誰還沒繳餐費？', '哪幾位阿姨最近兩週沒來？', '血壓偏高的長者有哪些？'].map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 bg-green-50 text-primary border border-green-200 rounded-full hover:bg-green-100 transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 max-h-64 overflow-y-auto mb-3 bg-gray-50 rounded-xl p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="輸入問題…"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleSend}
              className="p-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <label className="text-xs text-gray-500 block mb-2">選擇長者查看血壓趨勢</label>
            <select
              value={selectedMember.id}
              onChange={e => setSelectedMember(mockMembers.find(m => m.id === e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-3"
            >
              {mockMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <HealthTrendChart data={mockHealthData} memberId={selectedMember.id} memberName={selectedMember.name} />
        </div>
      </div>
    </div>
  )
}
