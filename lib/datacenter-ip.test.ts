import assert from 'node:assert/strict'
import test from 'node:test'
import { isLikelyAwsIp, looksLikeDatacenterVisit } from './datacenter-ip.ts'

test('isLikelyAwsIp matches screenshot IPs', () => {
  assert.equal(isLikelyAwsIp('54.85.237.109'), true)
  assert.equal(isLikelyAwsIp('52.20.19.128'), true)
  assert.equal(isLikelyAwsIp('13.219.19.81'), true)
  assert.equal(isLikelyAwsIp('35.174.58.0'), true)
  assert.equal(isLikelyAwsIp('117.2.158.122'), false) // Vietnam-like residential
})

test('looksLikeDatacenterVisit flags Ashburn US', () => {
  assert.equal(looksLikeDatacenterVisit({
    ip: '54.85.237.109',
    city: 'Ashburn',
    region: 'Virginia',
    country_code: 'US',
  }), true)
  assert.equal(looksLikeDatacenterVisit({
    ip: '117.2.158.122',
    city: 'Da Nang',
    region: 'Da Nang',
    country_code: 'VN',
  }), false)
})
