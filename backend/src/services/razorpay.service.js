import { createHmac, timingSafeEqual } from 'node:crypto'

const razorpayApiBase = 'https://api.razorpay.com/v1'
const requestTimeoutMs = 15000

class RazorpayServiceError extends Error {
  constructor(code, { uncertain = false } = {}) {
    super(code)
    this.name = 'RazorpayServiceError'
    this.code = code
    this.uncertain = uncertain
  }
}

function getRazorpayConfig(environment = process.env) {
  const keyId = environment.RAZORPAY_KEY_ID?.trim()
  const keySecret = environment.RAZORPAY_KEY_SECRET?.trim()
  const mode = environment.RAZORPAY_MODE?.trim()
  const anyConfigured = [keyId, keySecret, mode].some(Boolean)

  if (!anyConfigured) return null
  if (!keyId || !keySecret || !mode) {
    throw new RazorpayServiceError('razorpay_configuration_incomplete')
  }
  if (mode !== 'test') throw new RazorpayServiceError('razorpay_test_mode_only')

  return { keyId, keySecret }
}

function validateRazorpayConfiguration(environment = process.env) {
  return getRazorpayConfig(environment)
}

async function fetchJson(fetchImpl, url, options, { uncertain = false } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    let response
    try {
      response = await fetchImpl(url, { ...options, signal: controller.signal })
    } catch (error) {
      throw new RazorpayServiceError(
        error?.name === 'AbortError' ? 'razorpay_timeout' : 'razorpay_network_error',
        { uncertain },
      )
    }

    let data
    try {
      data = await response.json()
    } catch {
      throw new RazorpayServiceError('razorpay_invalid_response', { uncertain })
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new RazorpayServiceError('razorpay_invalid_response', { uncertain })
    }
    if (!response.ok) {
      throw new RazorpayServiceError(`razorpay_http_${response.status}`, {
        uncertain: uncertain || response.status >= 500,
      })
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function razorpayRequest(path, {
  method,
  body,
  fetchImpl = globalThis.fetch,
  environment = process.env,
  uncertain = false,
} = {}) {
  const config = getRazorpayConfig(environment)
  if (!config) throw new RazorpayServiceError('razorpay_not_configured')
  const authorization = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')
  return fetchJson(fetchImpl, `${razorpayApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, { uncertain })
}

function validateOrder(order, payment) {
  if (
    !order
    || typeof order.id !== 'string'
    || !order.id
    || order.amount !== payment.amountMinor
    || order.currency !== 'INR'
    || order.receipt !== payment.razorpayReceipt
    || !['created', 'attempted', 'paid'].includes(order.status)
  ) {
    throw new RazorpayServiceError('razorpay_order_mismatch', { uncertain: true })
  }
  return order
}

async function createRazorpayOrder(payment, options = {}) {
  const order = await razorpayRequest('/orders', {
    method: 'POST',
    body: {
      amount: payment.amountMinor,
      currency: 'INR',
      receipt: payment.razorpayReceipt,
      notes: {
        payment_id: String(payment._id),
        agreement_version: String(payment.agreementVersion),
      },
    },
    uncertain: true,
    ...options,
  })
  const validatedOrder = validateOrder(order, payment)
  if (validatedOrder.status !== 'created') {
    throw new RazorpayServiceError('razorpay_order_invalid_status', { uncertain: true })
  }
  return validatedOrder
}

async function findRazorpayOrdersByReceipt(receipt, options = {}) {
  const result = await razorpayRequest(`/orders?receipt=${encodeURIComponent(receipt)}`, {
    method: 'GET',
    uncertain: true,
    ...options,
  })
  if (!Array.isArray(result.items)) {
    throw new RazorpayServiceError('razorpay_invalid_response', { uncertain: true })
  }
  return result.items
}

async function fetchRazorpayPayment(paymentId, options = {}) {
  const payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    uncertain: true,
    ...options,
  })
  if (payment.id !== paymentId) {
    throw new RazorpayServiceError('razorpay_payment_id_mismatch', { uncertain: true })
  }
  return payment
}

function verifyCheckoutSignature(orderId, paymentId, signature, {
  environment = process.env,
} = {}) {
  const config = getRazorpayConfig(environment)
  if (!config) throw new RazorpayServiceError('razorpay_not_configured')
  if (
    typeof orderId !== 'string'
    || !orderId
    || typeof paymentId !== 'string'
    || !paymentId
    || typeof signature !== 'string'
    || !/^[\da-f]{64}$/i.test(signature)
  ) {
    return false
  }
  const expected = createHmac('sha256', config.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

function validateRazorpayPayment(payment, {
  expectedPaymentId,
  expectedOrderId,
  amountMinor,
}) {
  if (
    !payment
    || payment.id !== expectedPaymentId
    || payment.order_id !== expectedOrderId
    || payment.amount !== amountMinor
    || payment.currency !== 'INR'
    || !['authorized', 'captured', 'failed'].includes(payment.status)
  ) {
    throw new RazorpayServiceError('razorpay_payment_mismatch', { uncertain: true })
  }
  if (payment.status === 'captured' && payment.captured !== true) {
    throw new RazorpayServiceError('razorpay_capture_not_confirmed', { uncertain: true })
  }
  if (payment.status === 'authorized' && payment.captured !== false) {
    throw new RazorpayServiceError('razorpay_authorization_invalid', { uncertain: true })
  }
  return payment
}

export {
  RazorpayServiceError,
  createRazorpayOrder,
  fetchRazorpayPayment,
  findRazorpayOrdersByReceipt,
  getRazorpayConfig,
  validateOrder,
  validateRazorpayConfiguration,
  validateRazorpayPayment,
  verifyCheckoutSignature,
}
