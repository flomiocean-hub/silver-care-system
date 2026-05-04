import { HEALTH_NORMS } from '../services/mockData'

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
  if (member.is_alone || member.tags?.includes('獨居')) score += 30
  const absentDays = calcConsecutiveAbsent(attendanceHistory, member.id)
  score += Math.min(absentDays * 3, 30)

  const norm = HEALTH_NORMS[member.gender === '男' ? 'male' : 'female']
  const memberHealth = healthData.filter(h => h.member_id === member.id)
  const latestBP = memberHealth.slice(-1)[0]?.systolic ?? 120

  if (latestBP >= norm.bp_high.systolic) score += 25
  else if (latestBP >= norm.bp_warning.systolic[0]) score += 10

  if (memberHealth.length >= 3) {
    const recent = memberHealth.slice(-3).map(h => h.systolic)
    const max = Math.max(...recent), min = Math.min(...recent)
    if (max - min > 20) score += 15
  }

  // 體重暴跌警示
  if (memberHealth.length >= 2) {
    const weights = memberHealth.map(h => h.weight).filter(Boolean)
    if (weights.length >= 2) {
      const drop = weights[weights.length - 2] - weights[weights.length - 1]
      if (drop >= norm.weight_drop_alert_kg) score += 20
    }
  }

  return Math.min(score, 100)
}

export function getRiskLevel(score) {
  if (score >= 70) return { label: '高風險', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
  if (score >= 40) return { label: '需注意', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' }
  return { label: '正常', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' }
}

export function getBPStatus(systolic, diastolic, gender) {
  const norm = HEALTH_NORMS[gender === '男' ? 'male' : 'female']
  if (systolic >= norm.bp_high.systolic || diastolic >= norm.bp_high.diastolic)
    return { label: '偏高', color: 'text-red-600', bg: 'bg-red-50' }
  if (systolic >= norm.bp_warning.systolic[0] || diastolic >= norm.bp_warning.diastolic[0])
    return { label: '注意', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  return { label: '正常', color: 'text-green-600', bg: 'bg-green-50' }
}

export function checkWeightAlert(member, healthData) {
  const norm = HEALTH_NORMS[member.gender === '男' ? 'male' : 'female']
  const data = healthData.filter(h => h.member_id === member.id && h.weight)
  if (data.length < 2) return null
  const latest = data[data.length - 1].weight
  const prev = data[data.length - 2].weight
  const drop = prev - latest
  if (drop >= norm.weight_drop_alert_kg)
    return { drop: drop.toFixed(1), alert: true }
  return null
}
