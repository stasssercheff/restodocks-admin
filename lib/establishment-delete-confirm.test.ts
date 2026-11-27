import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/** Mirrors confirmEstablishmentDelete word-match rules (pin checked in DB). */
function matchesDeleteWord(confirm: string): boolean {
  const t = confirm.trim()
  return t === 'УДАЛИТЬ' || t.toLocaleLowerCase('ru-RU') === 'удалить'
}

describe('establishment delete confirm word', () => {
  it('accepts УДАЛИТЬ and case-insensitive удалить', () => {
    assert.equal(matchesDeleteWord('УДАЛИТЬ'), true)
    assert.equal(matchesDeleteWord(' удалить '), true)
    assert.equal(matchesDeleteWord('Удалить'), true)
    assert.equal(matchesDeleteWord('DELETE'), false)
    assert.equal(matchesDeleteWord(''), false)
  })
})
