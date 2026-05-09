import { supabase } from '../supabaseClient'
import { ORG_ID } from '../../config/org'

export async function getCourses() {
  const { data } = await supabase.from('courses').select('*').eq('org_id', ORG_ID).order('id')
  return data ?? []
}

export async function addCourse(course) {
  const { data, error } = await supabase.from('courses').insert({ ...course, org_id: ORG_ID }).select().single()
  if (error) throw error
  return data
}

export async function getEnrollments() {
  const { data } = await supabase.from('enrollments').select('*').eq('org_id', ORG_ID).order('enrolled_at')
  return data ?? []
}

export async function addEnrollment(enrollment) {
  const { data, error } = await supabase.from('enrollments').insert({ ...enrollment, org_id: ORG_ID }).select().single()
  if (error) throw error
  return data
}

export async function deleteEnrollment(enrollmentId, courseId, isWaitlist) {
  const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId)
  if (error) throw error
  await updateCourseCount(courseId, isWaitlist ? 'waitlist' : 'enrolled', -1)
}

export async function updateEnrollmentPayment(enrollmentId, totalPaid) {
  const { error } = await supabase.from('enrollments').update({ total_paid: totalPaid }).eq('id', enrollmentId)
  if (error) throw error
}

export async function updateEnrollmentMaterialPaid(enrollmentId, materialPaid) {
  const { error } = await supabase.from('enrollments').update({ material_paid: materialPaid }).eq('id', enrollmentId)
  if (error) throw error
}

export async function deleteCourse(courseId) {
  await supabase.from('enrollments').delete().eq('course_id', courseId)
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw error
}

export async function updateCourseCount(courseId, field, delta) {
  const { data: course } = await supabase.from('courses').select(field).eq('id', courseId).single()
  if (!course) return
  const { error } = await supabase
    .from('courses')
    .update({ [field]: (course[field] ?? 0) + delta })
    .eq('id', courseId)
  if (error) throw error
}
