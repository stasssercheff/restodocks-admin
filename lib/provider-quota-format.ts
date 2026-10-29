export type DeepseekBalanceRow = {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

export function pickPreferredBalance(
  balances: DeepseekBalanceRow[] | null | undefined,
): DeepseekBalanceRow | null {
  if (!balances?.length) return null
  const usd = balances.find(b => b.currency.toUpperCase() === 'USD')
  return usd ?? balances[0] ?? null
}

export function formatMoneyBalance(row: DeepseekBalanceRow | null): string {
  if (!row) return '—'
  const n = Number(row.total_balance)
  const cur = row.currency.toUpperCase() === 'CNY' ? '¥' : '$'
  if (!Number.isFinite(n)) return `${cur}${row.total_balance}`
  return `${cur}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
