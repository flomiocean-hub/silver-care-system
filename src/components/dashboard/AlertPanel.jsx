import { AlertTriangle, AlertCircle } from 'lucide-react'

export default function AlertPanel({ members }) {
  const highRisk = members.filter(m => m.risk_score >= 70)
  const medRisk = members.filter(m => m.risk_score >= 40 && m.risk_score < 70)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">AI 風險警示</h3>
      <div className="space-y-2">
        {highRisk.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <div>
              <span className="font-semibold text-red-700 text-sm">{m.name}</span>
              <span className="text-xs text-red-500 ml-2">風險分數 {m.risk_score}</span>
              <p className="text-xs text-red-500">最後出席：{m.last_seen}</p>
            </div>
          </div>
        ))}
        {medRisk.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
            <div>
              <span className="font-semibold text-yellow-700 text-sm">{m.name}</span>
              <span className="text-xs text-yellow-500 ml-2">風險分數 {m.risk_score}</span>
              <p className="text-xs text-yellow-500">最後出席：{m.last_seen}</p>
            </div>
          </div>
        ))}
        {highRisk.length === 0 && medRisk.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">目前無風險警示</p>
        )}
      </div>
    </div>
  )
}
