import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  filterRowsByExcludedIps,
  normalizeExcludeIp,
  parseExcludeIps,
  rowIpIsExcluded,
} from './exclude-ips.ts'

describe('normalizeExcludeIp', () => {
  it('trims and lowercases', () => {
    assert.equal(normalizeExcludeIp('  89.222.24.53  '), '89.222.24.53')
    assert.equal(normalizeExcludeIp('2001:DB8::1'), '2001:db8::1')
  })

  it('strips ipv4 :port and ipv6 brackets', () => {
    assert.equal(normalizeExcludeIp('89.222.24.53:443'), '89.222.24.53')
    assert.equal(normalizeExcludeIp('[2001:db8::1]'), '2001:db8::1')
  })
})

describe('parseExcludeIps', () => {
  it('splits on comma/semicolon/whitespace and dedupes', () => {
    assert.deepEqual(
      parseExcludeIps('123.19.137.228, 89.222.24.53;123.19.137.228\n10.0.0.1'),
      ['123.19.137.228', '89.222.24.53', '10.0.0.1'],
    )
  })
})

describe('rowIpIsExcluded / filterRowsByExcludedIps', () => {
  const rows = [
    { id: 1, ip: '123.19.137.228', city: 'Nha Trang' },
    { id: 2, ip: '123.19.137.228', city: 'Nha Trang' },
    { id: 3, ip: '89.222.24.53', city: 'London' },
    { id: 4, ip: '89.222.24.53', city: 'London' },
    { id: 5, ip: null, city: 'Unknown' },
    { id: 6, ip: '', city: 'Empty' },
  ]

  it('hides only the exact Vietnamese IP, keeps London and empty', () => {
    const filtered = filterRowsByExcludedIps(rows, '123.19.137.228')
    assert.deepEqual(
      filtered.map(r => r.id),
      [3, 4, 5, 6],
    )
  })

  it('does not treat substring / prefix as a match', () => {
    assert.equal(rowIpIsExcluded('89.222.24.53', new Set(['89.222'])), false)
    assert.equal(rowIpIsExcluded('89.222.24.53', new Set(['222.24'])), false)
    assert.equal(rowIpIsExcluded('123.19.137.228', new Set(['123.19.137.22'])), false)
  })

  it('does not hide neighbors when exclude list is empty', () => {
    assert.deepEqual(filterRowsByExcludedIps(rows, '  ').map(r => r.id), [1, 2, 3, 4, 5, 6])
  })

  it('matches normalized forms only', () => {
    assert.equal(rowIpIsExcluded('89.222.24.53:8080', ['89.222.24.53']), true)
    assert.equal(rowIpIsExcluded('89.222.24.53', ['89.222.24.53:8080']), true)
  })
})
