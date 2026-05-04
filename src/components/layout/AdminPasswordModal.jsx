import { useState } from 'react'
import { Lock, X } from 'lucide-react'
import { ADMIN_PASSWORD } from '../../services/mockData'

export default function AdminPasswordModal({ title, onConfirm, onCancel }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  function handleConfirm() {
    if (pw === ADMIN_PASSWORD) { onConfirm() }
    else { setError(true); setPw('') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Lock className="w-4 h-4 text-primary" /> 管理員驗證
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{title}</p>
        <input
          type="password"
          placeholder="請輸入管理員密碼"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          className={`w-full border rounded-xl px-4 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-primary ${error ? 'border-red-400' : 'border-gray-300'}`}
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mb-2">密碼錯誤，請再試一次</p>}
        <div className="flex gap-2 mt-2">
          <button onClick={handleConfirm}
            className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
            確認
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            取消
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">展示密碼：admin2025</p>
      </div>
    </div>
  )
}
