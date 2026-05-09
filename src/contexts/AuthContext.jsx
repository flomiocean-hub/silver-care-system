import { createContext, useContext, useState } from 'react'

const INITIAL_USERS = [
  { id: 1, username: 'superadmin', password: 'super2025',  name: 'Marco',    role: '超級管理者' },
  { id: 2, username: 'admin',      password: 'admin2025',  name: '系統管理員', role: '管理者' },
  { id: 3, username: 'staff01',    password: 'staff2025',  name: '李志明',     role: '關懷站專員' },
]

const STORAGE_KEY = 'sc_user'

function loadUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(loadUser)
  const [users, setUsers] = useState(INITIAL_USERS)

  function login(username, password) {
    const found = users.find(u => u.username === username && u.password === password)
    if (found) {
      setUser(found)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found))
      return true
    }
    return false
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  function addStaff({ username, password, name }) {
    const id = Math.max(...users.map(u => u.id)) + 1
    setUsers(p => [...p, { id, username, password, name, role: '關懷站專員' }])
  }

  function removeStaff(id) {
    setUsers(p => p.filter(u => u.id !== id))
  }

  const isSuperAdmin = user?.role === '超級管理者'
  const isAdmin      = user?.role === '管理者' || isSuperAdmin

  return (
    <AuthContext.Provider value={{
      user, users, login, logout, addStaff, removeStaff,
      isAdmin, isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
