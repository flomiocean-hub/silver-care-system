import { createContext, useContext, useState, useEffect } from 'react'
import { saveOrg, loadOrg } from '../config/org'
import { supabase } from '../services/supabaseClient'
import { findUserByCredentials, findUserByEmail } from '../services/api/users'

const USER_KEY = 'sc_user'

// 超級管理者保留在前端，不存 DB（最高安全後門）
const SUPERADMIN = { id: 0, username: 'superadmin', password: 'super2025', name: 'Marco', role: '超級管理者', org_id: null }

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

function buildUserFromRecord(record) {
  return {
    id:           record.id,
    name:         record.name,
    role:         record.role,
    org_id:       record.org_id,
    google_email: record.google_email ?? null,
    username:     record.username ?? null,
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(loadUser)
  const [currentOrg, setCurrentOrg]           = useState(loadOrg)
  const [pendingSuperAdmin, setPendingSuperAdmin] = useState(null) // 驗證完但尚未選組織
  const [googleError, setGoogleError]         = useState('')

  function applySession(userObj, org) {
    setUser(userObj)
    setCurrentOrg(org ?? null)
    localStorage.setItem(USER_KEY, JSON.stringify(userObj))
    if (org) saveOrg(org)
  }

  // Google OAuth 回調與 session 還原
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const record = await findUserByEmail(session.user.email)
          if (record) {
            applySession(buildUserFromRecord(record), record.organizations)
            setGoogleError('')
          } else {
            await supabase.auth.signOut()
            setGoogleError('此 Google 帳號尚未被授權，請聯絡管理者新增帳號')
          }
        } else if (event === 'SIGNED_OUT') {
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

  // 帳號密碼登入（管理者 + 超級管理者）
  // 回傳: { ok, needOrgPick }
  async function login(username, password) {
    // 超級管理者：本地驗證，暫存等待選組織（不立刻 setUser，避免跳過 org 選擇）
    if (username === SUPERADMIN.username && password === SUPERADMIN.password) {
      setPendingSuperAdmin(SUPERADMIN)
      return { ok: true, needOrgPick: true }
    }

    // 管理者：查 DB，org 自動帶入
    const record = await findUserByCredentials(username, password)
    if (!record) return { ok: false }

    applySession(buildUserFromRecord(record), record.organizations)
    return { ok: true, needOrgPick: false }
  }

  // 超級管理者選完組織後呼叫，才真正完成登入
  function completeSuperAdminLogin(org) {
    if (!pendingSuperAdmin) return
    applySession(pendingSuperAdmin, org)
    setPendingSuperAdmin(null)
  }

  async function loginWithGoogle() {
    setGoogleError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
  }

  async function logout() {
    const wasGoogle = !!user?.google_email
    setUser(null)
    setCurrentOrg(null)
    localStorage.removeItem(USER_KEY)
    if (wasGoogle) await supabase.auth.signOut()
  }

  const isSuperAdmin = user?.role === '超級管理者'
  const isAdmin      = user?.role === '管理者' || isSuperAdmin

  return (
    <AuthContext.Provider value={{
      user, currentOrg, pendingSuperAdmin,
      login, completeSuperAdminLogin, loginWithGoogle, logout,
      isAdmin, isSuperAdmin,
      googleError, setGoogleError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
