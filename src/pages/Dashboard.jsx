import { Users, UserCheck, DollarSign, AlertTriangle } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import AttendanceChart from '../components/dashboard/AttendanceChart'
import AlertPanel from '../components/dashboard/AlertPanel'
import { mockMembers, mockAttendance, mockFinance } from '../services/mockData'

export default function Dashboard() {
  const todayCount = mockAttendance[mockAttendance.length - 1]?.count ?? 0
  const totalMembers = mockMembers.length
  const highRiskCount = mockMembers.filter(m => m.risk_score >= 70).length
  const unpaidTotal = mockFinance.filter(f => !f.paid).reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">首頁儀表板</h1>
        <p className="text-sm text-gray-400 mt-1">今日 2025-05-03 · 展示資料</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="今日出席"
          value={todayCount}
          unit="人"
          trend="+8% 較上週"
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
          trend="本月未繳"
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AttendanceChart data={mockAttendance} />
        <AlertPanel members={mockMembers} />
      </div>
    </div>
  )
}
