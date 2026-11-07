import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { chunkIds } from './supabase-server.ts'

describe('chunkIds', () => {
  it('returns empty for empty input', () => {
    assert.deepEqual(chunkIds([]), [])
  })

  it('splits long id lists so PostgREST .in() stays under URL limits', () => {
    const ids = Array.from({ length: 250 }, (_, i) => `id-${i}`)
    const chunks = chunkIds(ids, 120)
    assert.equal(chunks.length, 3)
    assert.equal(chunks[0].length, 120)
    assert.equal(chunks[1].length, 120)
    assert.equal(chunks[2].length, 10)
  })
})
