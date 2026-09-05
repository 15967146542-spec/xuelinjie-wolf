export function calcChange(current: number, prevClose: number) {
  const delta = current - prevClose
  const ratio = prevClose === 0 ? 0 : (delta / prevClose) * 100
  return {
    delta,
    ratio
  }
}

export function formatCurrency(value: number, digits = 2) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`
}

export function formatCompactAmount(value: number, divisor = 10000, suffix = '万') {
  return `${(value / divisor).toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}${suffix}`
}

export function formatShares(value: number) {
  return value.toLocaleString('zh-CN')
}

export function formatPercent(value: number, digits = 2, withSign = true) {
  const prefix = withSign && value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(digits)}%`
}

export function formatSignedCurrency(value: number, digits = 2) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatCurrency(value, digits)}`
}

export function trendClass(value: number) {
  return value >= 0 ? 'up' : 'down'
}
