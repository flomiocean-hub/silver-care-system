const ORG_KEY = 'sc_org'

// Dynamic: reads current selected org from localStorage
export function getOrgId() {
  try {
    const org = JSON.parse(localStorage.getItem(ORG_KEY))
    return org?.id ?? 1
  } catch {
    return 1
  }
}

export function getOrgName() {
  try {
    const org = JSON.parse(localStorage.getItem(ORG_KEY))
    return org?.name ?? ''
  } catch {
    return ''
  }
}

export function saveOrg(org) {
  localStorage.setItem(ORG_KEY, JSON.stringify(org))
}

export function clearOrg() {
  localStorage.removeItem(ORG_KEY)
}

export function loadOrg() {
  try { return JSON.parse(localStorage.getItem(ORG_KEY)) } catch { return null }
}
