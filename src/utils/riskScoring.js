function calcConsecutiveAbsent(attendanceHistory, memberId) {
  const today = new Date()
  const memberDates = attendanceHistory
    .filter(a => a.member_id === memberId)
    .map(a => new Date(a.date))
  if (memberDates.length === 0) return 30
  const latest = new Date(Math.max(...memberDates))
  return Math.floor((today - latest) / (1000 * 60 * 60 * 24))
}

export function calcRiskScore(member, attendanceHistory, healthData) {
  let score = 0
  if (member.is_alone) score += 30
  const absentDays = calcConsecutiveAbsent(attendanceHistory, member.id)
  score += absentDays * 3
  const memberHealth = healthData.filter(h => h.member_id === member.id)
  const latestBP = memberHealth.slice(-1)[0]?.systolic ?? 120
  if (latestBP > 140) score += 25
  if (memberHealth.length >= 3) {
    const recent = memberHealth.slice(-3).map(h => h.systolic)
    const max = Math.max(...recent)
    const min = Math.min(...recent)
    if (max - min > 20) score += 15
  }
  return Math.min(score, 100)
}

export function getRiskLevel(score) {
  if (score >= 70) return { label: '高風險', color: 'danger', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  if (score >= 40) return { label: '需注意', color: 'warning', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  return { label: '正常', color: 'primary', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
}
