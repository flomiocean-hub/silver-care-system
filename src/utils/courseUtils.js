export function getLastDate(course) {
  if (!course.start_date) return null
  const start = new Date(course.start_date + 'T00:00:00')
  if (course.total_sessions <= 1) return start
  const last = new Date(start)
  last.setDate(last.getDate() + (course.total_sessions - 1) * 7)
  return last
}

export function isExpired(course) {
  const last = getLastDate(course)
  if (!last) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(last)
  expiry.setDate(expiry.getDate() + 1)
  return today >= expiry
}
