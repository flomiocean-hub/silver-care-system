import { createContext, useContext, useState } from 'react'

const INITIAL_USERS = [
  { id: 1, username: 'admin',   password: 'admin2025',  name: '系統管理員', role: '管理者' },
  { id: 2, username: 'staff01', password: 'staff2025',  name: '李志明',     role: '關懷站專員' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [users, setUsers] = useState(INITIAL_USERS)

  function login(username, password) {
    const found = users.find(u => u.username === username && u.password === password)
    if (found) { setUser(found); return true }
    return false
  }

  function logout() { setUser(null) }

  function addStaff({ username, password, name }) {
    const id = Math.max(...users.map(u => u.id)) + 1
    setUsers(p => [...p, { id, username, password, name, role: '關懷站專員' }])
  }

  function removeStaff(id) {
    setUsers(p => p.filter(u => u.id !== id))
  }

  return (
    <AuthContext.Provider value={{
      user, users, login, logout, addStaff, removeStaff,
      isAdmin: user?.role === '管理者',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
