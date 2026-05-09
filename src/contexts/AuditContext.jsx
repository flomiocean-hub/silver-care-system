import { createContext, useContext, useState } from 'react'
import { useAuth } from './AuthContext'

const AuditContext = createContext(null)

export function AuditProvider({ children }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])

  function addLog({ action, module, target, detail }) {
    setLogs(p => [{
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      user_name: user?.name ?? '未知',
      role: user?.role ?? '未知',
      action,
      module,
      target,
      detail,
    }, ...p])
  }

  return (
    <AuditContext.Provider value={{ logs, addLog }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() { return useContext(AuditContext) }
