export type BalanceSnapshot = {
  captured_at: string
  currency: string
  total_balance: number
  granted_balance: number
  topped_up_balance: number
}

/**
 * Wallet spend between two snapshots.
 * Spend = drop in total + any top-ups/grants added in the window.
 */
export function walletSpendBetween(start: BalanceSnapshot, end: BalanceSnapshot): number {
  const raw = start.total_balance - end.total_balance
  const topup = Math.max(0, end.topped_up_balance - start.topped_up_balance)
  const grant = Math.max(0, end.granted_balance - start.granted_balance)
  const spend = raw + topup + grant
  return spend > 0 ? Math.round(spend * 1e6) / 1e6 : 0
}

export function normalizeSnapshot(row: {
  captured_at: string
  currency?: string | null
  total_balance: unknown
  granted_balance?: unknown
  topped_up_balance?: unknown
}): BalanceSnapshot {
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return {
    captured_at: row.captured_at,
    currency: (row.currency || 'USD').toUpperCase(),
    total_balance: num(row.total_balance),
    granted_balance: num(row.granted_balance),
    topped_up_balance: num(row.topped_up_balance),
  }
}
