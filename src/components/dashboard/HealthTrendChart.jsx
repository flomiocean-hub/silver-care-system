import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function HealthTrendChart({ data, memberId, memberName }) {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const filtered = data
    .filter(d => d.member_id === memberId && new Date(d.date) >= threeMonthsAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">血壓趨勢 — {memberName}</h3>
      <p className="text-xs text-gray-400 mb-4">收縮壓 / 舒張壓（mmHg）· 近三個月</p>
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-gray-300">近三個月無量測記錄</div>
      ) : (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={filtered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} domain={[60, 180]} />
          <Tooltip />
          <Legend iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="systolic" name="收縮壓" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="diastolic" name="舒張壓" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}
