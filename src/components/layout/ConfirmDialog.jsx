export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold text-gray-800 text-base leading-snug">{title}</h3>
        {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary-light text-white'
            }`}
          >
            確認
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
