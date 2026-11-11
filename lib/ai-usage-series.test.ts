import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  chooseUsageBucket,
  fillUsageSeries,
  formatBucketLabel,
  formatBucketTooltip,
  lastHourPreset,
  todaySoFarPreset,
} from './ai-usage-series.ts'

describe('ai-usage-series', () => {
  it('chooses hour bucket for ≤48h windows', () => {
    assert.equal(
      chooseUsageBucket('2026-11-10T02:00:00.000Z', '2026-11-10T03:00:00.000Z'),
      'hour',
    )
    assert.equal(
      chooseUsageBucket('2026-11-01T00:00:00.000Z', '2026-11-10T23:59:59.999Z'),
      'day',
    )
  })

  it('zero-fills hourly series and keeps spend', () => {
    const series = fillUsageSeries(
      '2026-11-10T02:00:00.000Z',
      '2026-11-10T04:30:00.000Z',
      'UTC',
      'hour',
      [{ date: '2026-11-10 03:00', requests: 10, totalTokens: 100, estimatedCostUsd: 0.12 }],
    )
    assert.ok(series.length >= 3)
    const hit = series.find(p => p.date === '2026-11-10 03:00')
    assert.ok(hit)
    assert.equal(hit!.estimatedCostUsd, 0.12)
    assert.ok(series.some(p => p.date === '2026-11-10 02:00' && p.requests === 0))
  })

  it('does not spill a phantom next calendar day', () => {
    // 12.10 — 11.11 Asia/Ho_Chi_Minh (UTC+7), end of 11.11 local
    const series = fillUsageSeries(
      '2026-10-11T17:00:00.000Z',
      '2026-11-11T16:59:59.999Z',
      'Asia/Ho_Chi_Minh',
      'day',
      [{ date: '2026-11-11', requests: 1, totalTokens: 1, estimatedCostUsd: 1 }],
    )
    assert.equal(series[0]?.date, '2026-10-12')
    assert.equal(series[series.length - 1]?.date, '2026-11-11')
    assert.ok(!series.some(p => p.date === '2026-11-12'))
  })

  it('formats DeepSeek-style hour labels and tooltips', () => {
    assert.equal(formatBucketLabel('2026-11-10 09:00', 'hour'), '09:00~10:00')
    const tip = formatBucketTooltip(
      { date: '2026-11-10 09:00', requests: 5, totalTokens: 50, estimatedCostUsd: 0.09 },
      'hour',
      'estimatedCostUsd',
    )
    assert.match(tip, /09:00~10:00/)
    assert.match(tip, /\$0\.0900/)
  })

  it('builds last-hour and today presets', () => {
    const at = new Date('2026-11-10T09:37:00.000Z')
    const hour = lastHourPreset('UTC', at)
    assert.equal(hour.from, '2026-11-10')
    assert.equal(hour.to, '2026-11-10')
    assert.equal(hour.fromTime, '08:37')
    assert.equal(hour.toTime, '09:37')

    const today = todaySoFarPreset('UTC', at)
    assert.equal(today.fromTime, '00:00')
    assert.equal(today.toTime, '09:37')
  })
})
