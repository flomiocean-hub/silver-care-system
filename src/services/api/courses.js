import { supabase } from '../supabaseClient'

export async function getCourses() {
  const { data } = await supabase.from('courses').select('*').order('id')
  return data ?? []
}

export async function addCourse(course) {
  const { data, error } = await supabase.from('courses').insert(course).select().single()
  if (error) throw error
  return data
}

export async function getEnrollments() {
  const { data } = await supabase.from('enrollments').select('*').order('enrolled_at')
  return data ?? []
}

export async function addEnrollment(enrollment) {
  const { data, error } = await supabase.from('enrollments').insert(enrollment).select().single()
  if (error) throw error
  return data
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
