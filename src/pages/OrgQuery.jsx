import { useState, useEffect, useRef } from 'react'
import { Search, Send, Loader2, MapPin, Phone, User, Building2, CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react'
import { getCareStations } from '../services/api/careStations'
import { askGeminiOrgQuery, hasGemini } from '../services/geminiService'

const STATUS_CONFIG = {
  active:    { label: '合作中', color: 'bg-green-100 text-green-700', icon: CheckCircle2, iconColor: 'text-green-500' },
  contacted: { label: '已接觸', color: 'bg-blue-100 text-blue-700',  icon: Clock,         iconColor: 'text-blue-400'  },
  prospect:  { label: '待接觸', color: 'bg-gray-100 text-gray-600',  icon: Clock,         iconColor: 'text-gray-400'  },
  inactive:  { label: '不跟進', color: 'bg-red-100 text-red-600',    icon: XCircle,       iconColor: 'text-red-400'   },
}

const ORG_TYPE_LABELS = {
  GOV: '里辦公處', ASSOC: '社區發展協會', FOUND: '財團法人',
  CORP: '社團法人', REL: '宗教', ELDER: '長者服務', OTHER: '其他',
}

const QUICK_QUERIES = [
  '台北中華基督教會有合作嗎？',
  '大安區哪些單位是合作中？',
  '中山區的社區發展協會有哪些？',
  '有哪些財團法人已在合作？',
]

function renderAIText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

function OrgCard({ station, onClick, selected }) {
  const cfg = STATUS_CONFIG[station.status ?? 'prospect']
  const StatusIcon = cfg.icon
  return (
    <button
      onClick={() => onClick(station)}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected ? 'border-primary bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-green-50/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{station.org_name}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{station.district}</span>
        {station.contact_person && <span className="flex items-center gap-1"><User className="w-3 h-3" />{station.contact_person}</span>}
        {station.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{station.phone}</span>}
      </div>
    </button>
  )
}

function OrgDetail({ station, onClose }) {
  const cfg = STATUS_CONFIG[station.status ?? 'prospect']
  const StatusIcon = cfg.icon
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <h3 className="text-sm font-semibold text-gray-800 leading-snug">{station.org_name}</h3>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">關閉</button>
      </div>

      <div className="flex items-center gap-2">
        <StatusIcon className={`w-4 h-4 ${cfg.iconColor}`} />
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
        {station.status === 'active' && (
          <span className="text-xs text-green-600 font-medium">✓ 已加入合作夥伴</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {[
          { icon: MapPin, label: '行政區', value: station.district },
          { icon: Building2, label: '類型', value: ORG_TYPE_LABELS[station.org_type] ?? station.org_type },
          { icon: MapPin, label: '地址', value: station.address },
          { icon: User, label: '聯絡人', value: station.contact_person },
          { icon: Phone, label: '電話', value: station.phone },
        ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2 text-gray-600">
            <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-400 shrink-0 w-12">{label}</span>
            <span className="text-xs">{value}</span>
          </div>
        ))}
        {station.villages && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-12 shrink-0">服務里</span>
            <span className="text-xs text-gray-600">{station.villages}</span>
          </div>
        )}
      </div>

      {station.notes && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 font-medium mb-1">備註</p>
          <p className="text-xs text-gray-600">{station.notes}</p>
        </div>
      )}
    </div>
  )
}

export default function OrgQuery() {
  const [stations, setStations]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [messages, setMessages]       = useState([{
    role: 'ai',
    text: hasGemini
      ? '您好！請輸入單位名稱或行政區，我會幫您查詢合作狀態及聯絡資訊。\n例如：「台北中華基督教會有合作嗎？」或「大安區哪些單位合作中？」'
      : '您好！請輸入單位名稱或行政區進行查詢，我會列出相關據點資訊。',
    matchedIds: [],
  }])
  const [input, setInput]             = useState('')
  const [aiLoading, setAiLoading]     = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    getCareStations().then(data => { setStations(data); setLoading(false) })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleQuery(query) {
    if (!query.trim() || aiLoading) return
    const q = query.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q, matchedIds: [] }])
    setAiLoading(true)
    setSelectedStation(null)

    const { answer, matchedIds } = await askGeminiOrgQuery(q, stations)
    setMessages(prev => [...prev, { role: 'ai', text: answer, matchedIds }])
    setAiLoading(false)
  }

  const matchedStations = (ids) => stations.filter(s => ids.includes(s.id))

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" /> 合作單位查詢
        </h1>
        <p className="text-sm text-gray-400 mt-1">查詢台北市關懷站合作狀態及聯絡資訊 · 共 {stations.length} 個據點</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">

        {/* 左：對話區 */}
        <div className="flex flex-col flex-1 min-h-0">

          {/* 訊息列表 */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-3 min-h-48">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] space-y-2 ${msg.role === 'user' ? '' : 'w-full'}`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-primary font-medium">AI 查詢助理</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.role === 'ai'
                      ? <span dangerouslySetInnerHTML={{ __html: renderAIText(msg.text) }} />
                      : msg.text
                    }
                  </div>

                  {/* 匹配結果卡片 */}
                  {msg.role === 'ai' && matchedStations(msg.matchedIds).length > 0 && (
                    <div className="space-y-2 mt-2">
                      {matchedStations(msg.matchedIds).map(s => (
                        <OrgCard
                          key={s.id}
                          station={s}
                          onClick={setSelectedStation}
                          selected={selectedStation?.id === s.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> 查詢中...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 快速查詢 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUERIES.map(q => (
              <button key={q} onClick={() => handleQuery(q)} disabled={aiLoading || loading}
                className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
                {q}
              </button>
            ))}
          </div>

          {/* 輸入框 */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleQuery(input)}
              placeholder={loading ? '資料載入中...' : '輸入單位名稱或行政區查詢...'}
              disabled={aiLoading || loading}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition disabled:bg-gray-50"
            />
            <button
              onClick={() => handleQuery(input)}
              disabled={!input.trim() || aiLoading || loading}
              className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 右：單位詳情 */}
        {selectedStation && (
          <div className="w-full md:w-72 shrink-0">
            <OrgDetail station={selectedStation} onClose={() => setSelectedStation(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
