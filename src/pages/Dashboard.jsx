import { Users, UserCheck, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import AlertPanel from '../components/dashboard/AlertPanel'
import { mockMembers, mockAttendance, mockFinance } from '../services/mockData'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts'

export default function Dashboard() {
  const today = mockAttendance[mockAttendance.length - 1]
  const todayCount    = today?.count ?? 0
  const todayExpected = today?.expected ?? 0
  const todayRate     = today?.rate ?? 0
  const totalMembers  = mockMembers.length
  const highRiskCount = mockMembers.filter(m => m.risk_score >= 70).length
  const unpaidTotal   = mockFinance.reduce((s, r) => s + (r.amount_due - r.amount_paid), 0)

  const chartData = mockAttendance.map(d => ({
    date: d.date.slice(5),
    實到: d.count,
    預計: d.expected,
    出席率: d.rate,
  }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">首頁儀表板</h1>
        <p className="text-sm text-gray-400 mt-1">今日 2025-05-03 · 展示資料</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={`今日實到 / 預計 ${todayExpected} 人`}
          value={todayCount}
          unit="人"
          trend={`出席率 ${todayRate}%`}
          icon={<UserCheck className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="會員總人數"
          value={totalMembers}
          unit="人"
          trend="本月新增 1 位"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="高風險長者"
          value={highRiskCount}
          unit="人"
          trend="需立即關注"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="待收帳款"
          value={unpaidTotal}
          unit="元"
          trend="本月欠費合計"
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 實到 vs 預計 雙線圖 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">近 7 天出席：實到 vs 預計</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[20, 55]} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="實到" stroke="#1a6b4a" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="預計" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 出席率長條圖 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">每日出席率（%）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={v => [`${v}%`, '出席率']} />
              <Bar dataKey="出席率" fill="#2d9e6b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AlertPanel members={mockMembers} />
    </div>
  )
}
