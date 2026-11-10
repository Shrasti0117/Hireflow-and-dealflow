import assert from 'node:assert/strict'
import test from 'node:test'
import { convertMilestonePercentagesToBasisPoints, percentageToBasisPoints } from '../src/controllers/agreement.controller.js'

test('converts exact percentage decimals to basis points without floating-point multiplication', () => {
  assert.equal(percentageToBasisPoints(33.33), 3333)
  assert.equal(percentageToBasisPoints(33.34), 3334)
  assert.equal(percentageToBasisPoints(100), 10000)

  assert.deepEqual(
    convertMilestonePercentagesToBasisPoints([
      { name: 'Build', description: 'Implement', percentage: 33.33 },
      { name: 'Review', description: 'Review', percentage: 33.33 },
      { name: 'Handover', description: 'Hand over', percentage: 33.34 },
    ]).map((milestone) => milestone.percentageBps),
    [3333, 3333, 3334],
  )
})

test('rejects meaningful percentage precision beyond hundredths without rounding', () => {
  assert.throws(() => percentageToBasisPoints(33.333), /more than two meaningful decimal places/)
  assert.throws(() => percentageToBasisPoints(33.34000000000001), /more than two meaningful decimal places/)
})

test('rejects percentages outside the inclusive zero-to-100 range', () => {
  for (const percentage of [-0.01, 100.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => percentageToBasisPoints(percentage), /from 0 to 100/)
  }
})

test('requires converted milestone percentages to total exactly 10000 basis points', () => {
  assert.deepEqual(
    convertMilestonePercentagesToBasisPoints([
      { name: 'Only milestone', description: 'Complete everything', percentage: 100 },
    ]).map((milestone) => milestone.percentageBps),
    [10000],
  )
  assert.throws(() => convertMilestonePercentagesToBasisPoints([
    { name: 'Build', description: 'Implement', percentage: 33.33 },
    { name: 'Review', description: 'Review', percentage: 33.33 },
  ]), /total exactly 100%/)
})
