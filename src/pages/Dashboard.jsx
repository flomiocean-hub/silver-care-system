import { useState, useEffect, useCallback } from 'react'
import { Users, UserCheck, DollarSign, AlertTriangle, Loader2, X } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import AlertPanel from '../components/dashboard/AlertPanel'
import { getMembers } from '../services/api/members'
import { getAttendanceSummary } from '../services/api/attendance'
import { getFinanceRecords } from '../services/api/finance'
import { getTodayCheckins } from '../services/api/checkins'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

export default function Dashboard() {
  const [members, setMembers]       = useState([])
  const [attendance, setAttendance] = useState([])
  const [finance, setFinance]       = useState([])
  const [todayCheckins, setTodayCheckins] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showRiskModal, setShowRiskModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [m, a, f, tc] = await Promise.all([
      getMembers(), getAttendanceSummary(), getFinanceRecords(), getTodayCheckins()
    ])
    setMembers(m)
    setAttendance(a)
    setFinance(f)
    setTodayCheckins(tc)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const today          = new Date().toISOString().slice(0, 10)
  const todayCount     = todayCheckins.length
  const totalMembers   = members.length
  const highRiskMembers = members.filter(m => m.risk_score >= 70)
  const highRiskCount  = highRiskMembers.length
  const unpaidTotal    = finance.reduce((s, r) => s + (r.amount_due - r.amount_paid), 0)
  const prevAttendance = attendance.filter(d => d.date !== today).slice(-1)[0]
  const lastCount      = prevAttendance?.count ?? '—'
  const lastDate       = prevAttendance ? prevAttendance.date.slice(5).replace('-', '/') : ''

  const riskNormal  = members.filter(m => m.risk_score < 40).length
  const riskWatch   = members.filter(m => m.risk_score >= 40 && m.risk_score < 70).length
  const riskHigh    = highRiskCount

  const chartData = attendance.slice(-14).map(d => ({
    date: d.date.slice(5).replace('-', '/'),
    人數: d.count,
  }))

  const riskPieData = [
    { name: '正常',   value: riskNormal, color: '#22c55e' },
    { name: '需注意', value: riskWatch,  color: '#facc15' },
    { name: '高風險', value: riskHigh,   color: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">首頁儀表板</h1>
        <p className="text-sm text-gray-400 mt-1">今日 {new Date().toLocaleDateString('zh-TW')} · 即時資料</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="今日簽到"
          value={todayCount}
          unit="人"
          trend={lastDate ? `上次出席 ${lastCount} 人（${lastDate}）` : '尚無出席記錄'}
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
          trend="點擊查看計算規則"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          onClick={() => setShowRiskModal(true)}
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">近兩週每日出席人數</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-300">尚無出席資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={v => [`${v} 人`, '出席人數']} />
                <Bar dataKey="人數" fill="#1a6b4a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">長者風險分佈</h3>
          {members.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-300">尚無會員資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}`}
                  labelLine={false}
                >
                  {riskPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} 人`, name]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <AlertPanel members={members} />

      {showRiskModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRiskModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">高風險長者計算規則</h2>
              <button onClick={() => setShowRiskModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {[
                { label: '獨居', score: '+30 分' },
                { label: '連續缺席每天', score: '+3 分（上限 +30）' },
                { label: '最新血壓偏高（依性別標準）', score: '+10 分' },
                { label: '最新血壓達高血壓一期', score: '+25 分' },
                { label: '近3次血壓波動超過 20 mmHg', score: '+15 分' },
                { label: '近期體重暴跌', score: '+20 分' },
              ].map(({ label, score }) => (
                <div key={label} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-red-600">{score}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">風險等級（總分上限 100 分）</p>
              {[
                { label: '高風險', range: '≥ 70 分', dot: 'bg-red-500', text: 'text-red-700' },
                { label: '需注意', range: '40 – 69 分', dot: 'bg-yellow-400', text: 'text-yellow-700' },
                { label: '正常',   range: '< 40 分',  dot: 'bg-green-500', text: 'text-green-700' },
              ].map(({ label, range, dot, text }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                  <span className={`font-medium ${text}`}>{label}</span>
                  <span className="text-gray-400">{range}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: '正常',   count: riskNormal, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: '需注意', count: riskWatch,  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { label: '高風險', count: riskHigh,   color: 'bg-red-50 text-red-700 border-red-200' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-xl border p-3 ${color}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {highRiskMembers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">高風險長者名單</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {highRiskMembers.sort((a, b) => b.risk_score - a.risk_score).map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700 font-medium">{m.name}</span>
                      <span className="text-xs font-bold text-red-600">{m.risk_score} 分</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
