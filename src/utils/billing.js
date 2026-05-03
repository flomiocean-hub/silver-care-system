export function calcProRatedFee(totalFee, totalSessions, remainingSessions) {
  const perSession = totalFee / totalSessions
  return Math.round(perSession * remainingSessions)
}

export function calcMealFee(days) {
  return days * 30
}

export function calcMonthlyFee() {
  return 350
}
