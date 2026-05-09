import { createContext, useContext, useState } from 'react'
import { saveOrg, clearOrg, loadOrg } from '../config/org'

const USER_KEY = 'sc_user'

// org_id: null → 超級管理者可選任意組織登入
const INITIAL_USERS = [
  { id: 1, username: 'superadmin', password: 'super2025', name: 'Marco',    role: '超級管理者', org_id: null },
  { id: 2, username: 'admin',      password: 'admin2025', name: '系統管理員', role: '管理者',     org_id: 1   },
  { id: 3, username: 'staff01',    password: 'staff2025', name: '李志明',     role: '關懷站專員', org_id: 1   },
]

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(loadUser)
  const [currentOrg, setCurrentOrg] = useState(loadOrg)
  const [users, setUsers]       = useState(INITIAL_USERS)

  function login(username, password, org, rememberOrg) {
    const found = users.find(u => u.username === username && u.password === password)
    if (!found) return false

    // 非超級管理者：只能登入自己所屬的組織
    if (found.role !== '超級管理者' && org && found.org_id !== org.id) return false

    setUser(found)
    setCurrentOrg(org ?? null)
    localStorage.setItem(USER_KEY, JSON.stringify(found))

    if (org) {
      if (rememberOrg) saveOrg(org)
      else saveOrg(org) // 本次 session 也需要記住，否則 API 無法取得 org_id
    }
    return true
  }

  function logout() {
    setUser(null)
    setCurrentOrg(null)
    localStorage.removeItem(USER_KEY)
    // 不清除 sc_org，保留記憶方便下次登入
  }

  function addStaff({ username, password, name, org_id }) {
    const id = Math.max(...users.map(u => u.id)) + 1
    setUsers(p => [...p, { id, username, password, name, role: '關懷站專員', org_id }])
  }

  function removeStaff(id) {
    setUsers(p => p.filter(u => u.id !== id))
  }

  const isSuperAdmin = user?.role === '超級管理者'
  const isAdmin      = user?.role === '管理者' || isSuperAdmin

  return (
    <AuthContext.Provider value={{
      user, users, currentOrg, login, logout, addStaff, removeStaff,
      isAdmin, isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
