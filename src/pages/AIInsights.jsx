import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, AlertCircle, Activity, MessageSquare, Send, Loader2 } from 'lucide-react'
import { HEALTH_NORMS } from '../services/mockData'
import HealthTrendChart from '../components/dashboard/HealthTrendChart'
import { getRiskLevel, getBPStatus, checkWeightAlert } from '../utils/riskScoring'
import { askGeminiNLP, hasGemini } from '../services/geminiService'
import { getMembers } from '../services/api/members'
import { getHealthRecords } from '../services/api/health'
import { getFinanceRecords } from '../services/api/finance'

const AI_FALLBACK = {
  '誰兩週沒來': '依出席記錄分析，連續兩週以上未出席的長者：\n• **張桂英**（SC-005）— 最後出席 2025-04-10，已缺席 23 天，獨居高風險，建議立即電訪\n• **陳美華**（SC-001）— 最後出席 2025-04-18，已缺席 15 天，已列入孤獨死預警名單',
  '午餐費': '本月午餐費尚未繳費的長者：\n• **吳秀蘭**（SC-007）— 欠費 30 元\n共 1 位，總欠費 30 元。',
  '血壓偏高': '依台灣中高齡健康基準，近期血壓偏高的長者：\n• **陳美華**（SC-001，女）— 收縮壓 148 mmHg ↑\n• **吳秀蘭**（SC-007，女）— 收縮壓 162 mmHg，嚴重偏高 ↑↑\n• **王淑芬**（SC-003，女）— 收縮壓 142 mmHg ↑\n建議提醒按時服藥並安排複診。',
  default: hasGemini
    ? '您好！我是 AI 關懷助理（Gemini 模式），請直接輸入問題，我會根據系統資料即時分析。\n例如：「誰的健康狀況需要特別注意？」、「最近哪些長者出席率偏低？」'
    : '您好！我是關懷據點 AI 助理，可幫您查詢出席、血壓、繳費等資訊。\n可試問：「誰兩週沒來了？」、「誰的午餐費還沒繳？」、「血壓偏高的名單？」',
}

function getFallbackResponse(query) {
  for (const [key, val] of Object.entries(AI_FALLBACK)) {
    if (key !== 'default' && query.includes(key.slice(0, 4))) return val
  }
  return AI_FALLBACK.default
}

const QUICK_QUERIES = [
  '誰兩週沒來了？',
  '誰的午餐費還沒繳？',
  '血壓偏高的名單是誰？',
  ...(hasGemini ? ['哪些長者需要優先關注？', '這個月出席狀況如何？'] : []),
]

function renderAIText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

export default function AIInsights() {
  const [members, setMembers]       = useState([])
  const [healthData, setHealthData] = useState([])
  const [finance, setFinance]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [messages, setMessages]     = useState([{ role: 'ai', text: AI_FALLBACK.default }])
  const [input, setInput]           = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const chatEndRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [m, h, f] = await Promise.all([getMembers(), getHealthRecords(), getFinanceRecords()])
    setMembers(m)
    setHealthData(h)
    setFinance(f)
    if (m.length > 0) setSelectedMemberId(m[0].id)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiLoading])

  const membersWithHealth = members.filter(m => healthData.some(h => h.member_id === m.id))
  const selectedMember = membersWithHealth.find(m => m.id === selectedMemberId) ?? membersWithHealth[0]

  const ALERT_DAYS = 30
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ALERT_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const aloneHighRisk = members.filter(m => m.tags?.includes('獨居') && m.risk_score >= 60)

  const bpAbnormal = members.filter(m => {
    const health = healthData.filter(h => h.member_id === m.id)
    if (!health.length) return false
    const latest = health[health.length - 1]
    if (!latest.date || latest.date < cutoffStr) return false
    const norm = HEALTH_NORMS[m.gender === '男' ? 'male' : 'female']
    return latest.systolic >= norm.bp_high.systolic || latest.diastolic >= norm.bp_high.diastolic
  })

  const recentHealth = healthData.filter(h => h.date >= cutoffStr)
  const weightAlerts = members.filter(m => checkWeightAlert(m, recentHealth)?.alert)

  async function sendQuery(text) {
    if (!text.trim() || aiLoading) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text }])
    setAiLoading(true)

    let reply = null
    if (hasGemini) {
      reply = await askGeminiNLP(text, { members, healthData, finance })
    }
    if (!reply) reply = getFallbackResponse(text)

    setMessages(p => [...p, { role: 'ai', text: reply }])
    setAiLoading(false)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI 關懷洞察
          </h1>
          <p className="text-sm text-gray-400 mt-1">依台灣中高齡（60歲以上）健康基準，性別差異化判定</p>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-full font-medium shrink-0 ${
          hasGemini ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {hasGemini ? '✦ Gemini AI 已啟用' : '展示模式'}
        </div>
      </div>

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
            <Activity className="w-4 h-4" /> 血壓異常（近 {ALERT_DAYS} 天・依性別基準）
          </h3>
          <div className="space-y-2">
            {bpAbnormal.length === 0 ? <p className="text-xs text-gray-400">目前無異常</p> :
              bpAbnormal.map(m => {
                const h = healthData.filter(d => d.member_id === m.id).slice(-1)[0]
                const bp = h ? getBPStatus(h.systolic, h.diastolic, m.gender) : null
                return (
                  <div key={m.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-amber-700 text-sm">{m.name} · {m.gender}</p>
                        <p className="text-xs text-amber-500">{h?.systolic}/{h?.diastolic} mmHg · 脈搏 {h?.pulse}</p>
                        <p className="text-xs text-gray-400">基準：{m.gender === '女' ? '130' : '145'} mmHg</p>
                        <p className="text-xs text-gray-400">量測日：{h?.date}</p>
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
            <Activity className="w-4 h-4" /> 體重暴跌警示（近 {ALERT_DAYS} 天）
          </h3>
          <div className="space-y-2">
            {weightAlerts.length === 0 ? <p className="text-xs text-gray-400">目前無體重異常</p> :
              weightAlerts.map(m => {
                const alert = checkWeightAlert(m, healthData)
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            自然語言查詢
            {hasGemini && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-normal">Gemini</span>}
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUERIES.map(q => (
              <button key={q} onClick={() => sendQuery(q)} disabled={aiLoading}
                className="text-xs px-3 py-1.5 bg-green-50 text-primary border border-green-200 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50">
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
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-gray-400">AI 分析中…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendQuery(input))}
              placeholder={hasGemini ? '直接輸入任何問題…' : '輸入問題…'}
              disabled={aiLoading}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50" />
            <button onClick={() => sendQuery(input)} disabled={aiLoading || !input.trim()}
              className="p-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <label className="text-xs text-gray-500 block mb-2">選擇長者查看血壓趨勢（近三個月）</label>
            {membersWithHealth.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">尚無量測記錄</p>
            ) : (
              <select value={selectedMember?.id ?? ''}
                onChange={e => setSelectedMemberId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {membersWithHealth.map(m => (
                  <option key={m.id} value={m.id}>{m.name}（{m.gender}）</option>
                ))}
              </select>
            )}
          </div>
          {selectedMember && (
            <HealthTrendChart data={healthData} memberId={selectedMember.id} memberName={selectedMember.name} />
          )}

        </div>
      </div>
    </div>
  )
}
