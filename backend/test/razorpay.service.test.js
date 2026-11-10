import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  RazorpayServiceError,
  createRazorpayOrder,
  fetchRazorpayPayment,
  findRazorpayOrdersByReceipt,
  getRazorpayConfig,
  validateRazorpayPayment,
  verifyCheckoutSignature,
} from '../src/services/razorpay.service.js'

const environment = {
  RAZORPAY_KEY_ID: 'rzp_test_id',
  RAZORPAY_KEY_SECRET: 'test-secret',
  RAZORPAY_MODE: 'test',
}
const payment = {
  _id: 'payment1234567890123456',
  agreementVersion: 1,
  amountMinor: 12345,
  currency: 'INR',
  razorpayReceipt: 'df-payment1234567890123456',
}

function providerResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

function mockFetch(responses, requests = []) {
  return async (url, options) => {
    requests.push({ url: String(url), options })
    const result = responses.shift()
    if (result instanceof Error) throw result
    return result
  }
}

function razorpayOrder(overrides = {}) {
  return {
    id: 'order_123',
    entity: 'order',
    amount: 12345,
    currency: 'INR',
    receipt: payment.razorpayReceipt,
    status: 'created',
    ...overrides,
  }
}

test('requires complete Test Mode credentials and rejects Live Mode', () => {
  assert.equal(getRazorpayConfig({}), null)
  assert.deepEqual(getRazorpayConfig(environment), {
    keyId: environment.RAZORPAY_KEY_ID,
    keySecret: environment.RAZORPAY_KEY_SECRET,
  })
  assert.throws(
    () => getRazorpayConfig({ ...environment, RAZORPAY_MODE: 'live' }),
    (error) => error instanceof RazorpayServiceError && error.code === 'razorpay_test_mode_only',
  )
  assert.throws(
    () => getRazorpayConfig({ RAZORPAY_KEY_ID: 'rzp_test_id' }),
    (error) => error.code === 'razorpay_configuration_incomplete',
  )
  assert.throws(
    () => getRazorpayConfig({ ...environment, RAZORPAY_MODE: undefined }),
    (error) => error.code === 'razorpay_configuration_incomplete',
  )
})

test('creates an INR order in integer paise with a stable server-derived receipt', async () => {
  const requests = []
  const order = await createRazorpayOrder(payment, {
    environment,
    fetchImpl: mockFetch([providerResponse(razorpayOrder())], requests),
  })
  assert.equal(order.id, 'order_123')
  assert.equal(requests[0].url, 'https://api.razorpay.com/v1/orders')
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    amount: 12345,
    currency: 'INR',
    receipt: payment.razorpayReceipt,
    notes: {
      payment_id: payment._id,
      agreement_version: '1',
    },
  })
  assert.match(requests[0].options.headers.Authorization, /^Basic /)
  assert.equal('Idempotency-Key' in requests[0].options.headers, false)
  assert.ok(payment.razorpayReceipt.length <= 40)
})

test('rejects missing IDs, wrong amounts, currency, receipt, and order status', async () => {
  for (const invalidOrder of [
    razorpayOrder({ id: undefined }),
    razorpayOrder({ amount: 12346 }),
    razorpayOrder({ currency: 'USD' }),
    razorpayOrder({ receipt: 'browser-receipt' }),
    razorpayOrder({ status: 'paid' }),
  ]) {
    await assert.rejects(
      createRazorpayOrder(payment, {
        environment,
        fetchImpl: mockFetch([providerResponse(invalidOrder)]),
      }),
      /razorpay_order/,
    )
  }
})

test('verifies Checkout signatures with HMAC-SHA256 and rejects invalid signatures', () => {
  const signature = createHmac('sha256', environment.RAZORPAY_KEY_SECRET)
    .update('order_123|pay_123')
    .digest('hex')
  assert.equal(verifyCheckoutSignature('order_123', 'pay_123', signature, { environment }), true)
  assert.equal(verifyCheckoutSignature('order_123', 'pay_other', signature, { environment }), false)
  assert.equal(verifyCheckoutSignature('order_123', 'pay_123', 'not-a-signature', { environment }), false)
})

test('fetches payment details and validates exact payment/order IDs, amount, INR, and captured status', async () => {
  const providerPayment = {
    id: 'pay_123',
    order_id: 'order_123',
    amount: 12345,
    currency: 'INR',
    status: 'captured',
    captured: true,
    created_at: 1700000000,
  }
  const fetched = await fetchRazorpayPayment('pay_123', {
    environment,
    fetchImpl: mockFetch([providerResponse(providerPayment)]),
  })
  assert.equal(fetched.id, 'pay_123')
  assert.equal(validateRazorpayPayment(providerPayment, {
    expectedPaymentId: 'pay_123',
    expectedOrderId: 'order_123',
    amountMinor: 12345,
  }).status, 'captured')

  const invalidPayments = [
    { ...providerPayment, id: 'pay_other' },
    { ...providerPayment, order_id: 'order_other' },
    { ...providerPayment, amount: 12346 },
    { ...providerPayment, currency: 'USD' },
    { ...providerPayment, captured: false },
    { ...providerPayment, status: 'created' },
  ]
  for (const invalid of invalidPayments) {
    assert.throws(
      () => validateRazorpayPayment(invalid, {
        expectedPaymentId: 'pay_123',
        expectedOrderId: 'order_123',
        amountMinor: 12345,
      }),
      /razorpay_/,
    )
  }
  await assert.rejects(
    fetchRazorpayPayment('pay_123', {
      environment,
      fetchImpl: mockFetch([providerResponse({ ...providerPayment, id: 'pay_other' })]),
    }),
    /razorpay_payment_id_mismatch/,
  )
})

test('authorized payments remain pending and are never treated as captured', () => {
  const authorized = {
    id: 'pay_123',
    order_id: 'order_123',
    amount: 12345,
    currency: 'INR',
    status: 'authorized',
    captured: false,
  }
  assert.equal(validateRazorpayPayment(authorized, {
    expectedPaymentId: 'pay_123',
    expectedOrderId: 'order_123',
    amountMinor: 12345,
  }).status, 'authorized')
})

test('Razorpay timeouts and malformed responses are safe and order-creation timeouts uncertain', async () => {
  const timeout = new Error('network details')
  timeout.name = 'AbortError'
  await assert.rejects(
    createRazorpayOrder(payment, { environment, fetchImpl: mockFetch([timeout]) }),
    (error) => error.code === 'razorpay_timeout' && error.uncertain,
  )
  await assert.rejects(
    createRazorpayOrder(payment, {
      environment,
      fetchImpl: mockFetch([{
        ok: true,
        status: 200,
        json: async () => { throw new Error('sensitive provider response') },
      }]),
    }),
    (error) => error.code === 'razorpay_invalid_response' && error.uncertain,
  )
})

test('reconciles an order only through its persisted unique receipt', async () => {
  const matches = await findRazorpayOrdersByReceipt(payment.razorpayReceipt, {
    environment,
    fetchImpl: mockFetch([providerResponse({ items: [razorpayOrder({ status: 'attempted' })] })]),
  })
  assert.equal(matches[0].receipt, payment.razorpayReceipt)
  const requests = []
  await findRazorpayOrdersByReceipt(payment.razorpayReceipt, {
    environment,
    fetchImpl: mockFetch([providerResponse({ items: [] })], requests),
  })
  assert.equal(requests[0].url, `https://api.razorpay.com/v1/orders?receipt=${payment.razorpayReceipt}`)
})
