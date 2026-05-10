import { createContext, useContext, useState, useEffect } from 'react'
import { saveOrg, loadOrg } from '../config/org'
import { supabase } from '../services/supabaseClient'
import { findStaffByEmail } from '../services/api/staff'

const USER_KEY = 'sc_user'

const INITIAL_USERS = [
  { id: 1, username: 'superadmin', password: 'super2025', name: 'Marco',    role: '超級管理者', org_id: null },
  { id: 2, username: 'admin',      password: 'admin2025', name: '系統管理員', role: '管理者',     org_id: 1   },
]

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(loadUser)
  const [currentOrg, setCurrentOrg] = useState(loadOrg)
  const [users, setUsers]           = useState(INITIAL_USERS)
  const [googleError, setGoogleError] = useState('')

  // Handle Google OAuth callback and session restore
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const staff = await findStaffByEmail(session.user.email)
          if (staff) {
            const staffUser = {
              id:           staff.id,
              name:         staff.name,
              role:         '關懷站專員',
              org_id:       staff.org_id,
              google_email: staff.google_email,
            }
            const org = staff.organizations
            setUser(staffUser)
            setCurrentOrg(org)
            saveOrg(org)
            localStorage.setItem(USER_KEY, JSON.stringify(staffUser))
            setGoogleError('')
          } else {
            // Email not in whitelist — sign out immediately
            await supabase.auth.signOut()
            setGoogleError('此 Google 帳號尚未被授權，請聯絡管理者新增帳號')
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear state if it was a Google-authenticated user
          const stored = loadUser()
          if (stored?.google_email) {
            setUser(null)
            setCurrentOrg(null)
            localStorage.removeItem(USER_KEY)
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  function login(username, password, org, rememberOrg) {
    const found = users.find(u => u.username === username && u.password === password)
    if (!found) return false
    if (found.role !== '超級管理者' && org && found.org_id !== org.id) return false

    setUser(found)
    setCurrentOrg(org ?? null)
    localStorage.setItem(USER_KEY, JSON.stringify(found))
    if (org) saveOrg(org)
    return true
  }

  async function loginWithGoogle() {
    setGoogleError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function logout() {
    const wasGoogle = !!user?.google_email
    setUser(null)
    setCurrentOrg(null)
    localStorage.removeItem(USER_KEY)
    if (wasGoogle) await supabase.auth.signOut()
  }

  // Legacy: admin creates admin-level accounts (in-memory)
  function addAdminUser({ username, password, name, org_id, role = '管理者' }) {
    const id = Math.max(...users.map(u => u.id)) + 1
    setUsers(p => [...p, { id, username, password, name, role, org_id }])
  }

  function removeAdminUser(id) {
    setUsers(p => p.filter(u => u.id !== id))
  }

  const isSuperAdmin = user?.role === '超級管理者'
  const isAdmin      = user?.role === '管理者' || isSuperAdmin

  return (
    <AuthContext.Provider value={{
      user, users, currentOrg,
      login, loginWithGoogle, logout,
      addAdminUser, removeAdminUser,
      isAdmin, isSuperAdmin,
      googleError, setGoogleError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
