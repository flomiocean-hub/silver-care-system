export default function StatCard({ title, value, unit, trend, icon, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  const iconBg = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }
  return (
    <div className={`rounded-xl border p-3 md:p-5 flex items-center gap-2 md:gap-4 bg-white shadow-sm ${colors[color]}`}>
      <div className={`p-2 md:p-3 rounded-xl shrink-0 ${iconBg[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs font-medium opacity-70 mb-0.5 leading-tight">{title}</p>
        <div className="flex items-end gap-1">
          <span className="text-xl md:text-3xl font-bold">{value}</span>
          {unit && <span className="text-xs md:text-sm mb-0.5 opacity-70">{unit}</span>}
        </div>
        {trend && (
          <span className="text-[10px] md:text-xs font-medium opacity-80 leading-tight">{trend}</span>
        )}
      </div>
    </div>
  )
}
