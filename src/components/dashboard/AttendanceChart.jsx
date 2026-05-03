import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AttendanceChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">近 7 天出席人數</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} domain={[20, 55]} />
          <Tooltip
            formatter={(v) => [`${v} 人`, '出席人數']}
            labelFormatter={l => `日期：${l}`}
          />
          <Line type="monotone" dataKey="count" stroke="#1a6b4a" strokeWidth={2.5}
            dot={{ fill: '#1a6b4a', r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
