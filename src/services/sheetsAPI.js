const API_URL = import.meta.env.VITE_SHEETS_API_URL
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

export async function fetchSheet(sheetName) {
  if (USE_MOCK || !API_URL) return null
  const res = await fetch(`${API_URL}?sheet=${sheetName}`)
  const json = await res.json()
  return json.data
}

export async function appendRow(sheetName, row) {
  if (USE_MOCK || !API_URL) {
    console.log('[Mock] appendRow', sheetName, row)
    return { success: true }
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ sheet: sheetName, row }),
  })
  return res.json()
}
