// 西元年 → 民國年顯示（e.g. "1949-11-15" → "民國38年11月15日"）
export function toRocDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y) return isoDate
  const roc = y - 1911
  if (roc <= 0) return isoDate
  return `民國${roc}年${m}月${d}日`
}

// 民國年字串 → 西元年 ISO（e.g. "038/11/15" → "1949-11-15"）
export function rocToIso(rocStr) {
  if (!rocStr) return ''
  const m = rocStr.match(/^(\d+)[\/\-](\d+)[\/\-](\d+)$/)
  if (!m) return rocStr
  const [, y, mo, d] = m
  return `${Number(y) + 1911}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
}

// 顯示雙曆（西元 + 民國）
export function dualDate(isoDate) {
  if (!isoDate) return ''
  const roc = toRocDate(isoDate)
  return `${isoDate}（${roc}）`
}
