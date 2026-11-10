import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Payment from '../src/models/Payment.js'

function paymentData(overrides = {}) {
  return {
    agreement: new mongoose.Types.ObjectId(),
    project: new mongoose.Types.ObjectId(),
    client: new mongoose.Types.ObjectId(),
    mode: 'razorpay_test_demo',
    amountMinor: 12345,
    currency: 'INR',
    agreementVersion: 1,
    snapshotHash: 'a'.repeat(64),
    razorpayReceipt: 'df-test-receipt',
    ...overrides,
  }
}

test('validates payment schema, integer INR amount, sandbox mode, and sanitized errors', () => {
  assert.equal(new Payment(paymentData()).validateSync(), undefined)
  assert.ok(new Payment(paymentData({ amountMinor: 12.5 })).validateSync()?.errors.amountMinor)
  assert.ok(new Payment(paymentData({ currency: 'USD' })).validateSync()?.errors.currency)
  assert.ok(new Payment(paymentData({ mode: 'razorpay_live' })).validateSync()?.errors.mode)
  assert.ok(new Payment(paymentData({ razorpayReceipt: 'x'.repeat(41) })).validateSync()?.errors.razorpayReceipt)
  assert.ok(new Payment(paymentData({ lastErrorCode: 'secret token' })).validateSync()?.errors.lastErrorCode)
})

test('declares unique agreement, Razorpay order, payment, and receipt indexes', () => {
  const indexes = Payment.schema.indexes()
  const uniqueAgreement = indexes.find(([key]) => key.agreement === 1)
  const uniqueOrder = indexes.find(([key]) => key.razorpayOrderId === 1)
  const uniquePayment = indexes.find(([key]) => key.razorpayPaymentId === 1)
  const uniqueReceipt = indexes.find(([key]) => key.razorpayReceipt === 1)

  assert.equal(uniqueAgreement?.[1].unique, true)
  assert.equal(uniqueOrder?.[1].unique, true)
  assert.deepEqual(uniqueOrder?.[1].partialFilterExpression, {
    razorpayOrderId: { $type: 'string' },
  })
  assert.equal(uniquePayment?.[1].unique, true)
  assert.deepEqual(uniquePayment?.[1].partialFilterExpression, {
    razorpayPaymentId: { $type: 'string' },
  })
  assert.equal(uniqueReceipt?.[1].unique, true)
})
