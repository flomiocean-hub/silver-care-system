import { useState } from 'react'
import { History, Filter, Lock } from 'lucide-react'
import { useAudit } from '../contexts/AuditContext'
import { useAuth } from '../contexts/AuthContext'

const ACTION_STYLE = {
  '新增':     'bg-green-100 text-green-700',
  '修改':     'bg-amber-100 text-amber-700',
  '刪除':     'bg-red-100 text-red-700',
  '簽到':     'bg-blue-100 text-blue-700',
  '匯出':     'bg-purple-100 text-purple-700',
  '發送通知': 'bg-orange-100 text-orange-700',
}

function fmtTime(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function AuditLog() {
  const { logs } = useAudit()
  const { isAdmin } = useAuth()
  const [filterAction, setFilterAction] = useState('all')
  const [filterModule, setFilterModule] = useState('all')

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Lock className="w-12 h-12 text-gray-200 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 mb-2">權限不足</h2>
        <p className="text-sm text-gray-400">操作記錄功能僅供管理者使用</p>
      </div>
    )
  }

  const allModules = ['all', ...Array.from(new Set(logs.map(l => l.module)))]

  const filtered = logs.filter(l => {
    const okAction = filterAction === 'all' || l.action === filterAction
    const okModule = filterModule === 'all' || l.module === filterModule
    return okAction && okModule
  })

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> 操作記錄
        </h1>
        <p className="text-sm text-gray-400 mt-1">共 {logs.length} 筆記錄（本次登入後）</p>
      </div>

      {/* 篩選列 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">動作</span>
          <div className="flex gap-1 flex-wrap">
            {['all', '新增', '修改', '刪除', '簽到', '匯出', '發送通知'].map(a => (
              <button key={a} onClick={() => setFilterAction(a)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterAction === a ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {a === 'all' ? '全部' : a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">模組</span>
          <div className="flex gap-1 flex-wrap">
            {allModules.map(m => (
              <button key={m} onClick={() => setFilterModule(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterModule === m ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {m === 'all' ? '全部' : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 記錄表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">本次登入尚無操作記錄</p>
            <p className="text-gray-300 text-xs mt-1">新增、修改、刪除等操作會自動記錄於此</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">目前篩選條件無符合記錄</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 whitespace-nowrap">時間</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">操作者</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">角色</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">動作</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap">模組</th>
                  <th className="text-left py-3 px-4">對象</th>
                  <th className="text-left py-3 px-4">說明</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {fmtTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.role === '管理者' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLE[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {log.module}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-xs max-w-[140px] truncate" title={log.target}>
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {log.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
