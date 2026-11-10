import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import http from 'node:http'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const mongoUri = process.env.PAYMENT_API_TEST_MONGODB_URI
const jwtSecret = process.env.PAYMENT_API_TEST_JWT_SECRET
const testEnabled = Boolean(mongoUri && jwtSecret)

function razorpayResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

function requestJson(baseUrl, path, {
  method = 'GET',
  user,
  csrfToken,
  origin = 'http://localhost:5173',
  payload,
} = {}) {
  const url = new URL(path, baseUrl)
  const headers = { origin }
  if (user) headers.cookie = `dealflow_token=${user.token}; dealflow_csrf=${user.csrfToken}`
  if (csrfToken !== undefined) headers['x-csrf-token'] = csrfToken
  if (payload !== undefined) headers['content-type'] = 'application/json'

  return new Promise((resolve, reject) => {
    const request = http.request(url, { method, headers }, (response) => {
      let raw = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { raw += chunk })
      response.on('end', () => {
        try {
          resolve({ status: response.statusCode, data: JSON.parse(raw) })
        } catch (error) {
          reject(error)
        }
      })
    })
    request.on('error', reject)
    if (payload !== undefined) request.write(JSON.stringify(payload))
    request.end()
  })
}

test('Razorpay payment API enforces ownership and safely verifies a Test Mode payment', {
  skip: !testEnabled,
}, async () => {
  const databaseName = decodeURIComponent(new URL(mongoUri).pathname.replace(/^\/+/, ''))
  assert.match(databaseName, /test/i, 'PAYMENT_API_TEST_MONGODB_URI must target a dedicated test database')

  const origin = 'http://localhost:5173'
  const razorpaySecret = 'integration-razorpay-test-secret'
  process.env.JWT_SECRET = jwtSecret
  process.env.FRONTEND_ORIGIN = origin
  process.env.RAZORPAY_KEY_ID = 'rzp_test_integration'
  process.env.RAZORPAY_KEY_SECRET = razorpaySecret
  process.env.RAZORPAY_MODE = 'test'

  let server
  let originalFetch
  let Agreement
  let Payment
  let Project
  let Provider
  let User
  const createdIds = { users: [], projects: [], agreements: [], providers: [], payments: [] }

  try {
    await mongoose.connect(mongoUri)
    ;({ default: Agreement } = await import('../src/models/Agreement.js'))
    ;({ default: Payment } = await import('../src/models/Payment.js'))
    ;({ default: Project } = await import('../src/models/Project.js'))
    ;({ default: Provider } = await import('../src/models/Provider.js'))
    ;({ default: User } = await import('../src/models/User.js'))
    const { default: app } = await import('../src/app.js')
    const { createAgreementSnapshot } = await import('../src/models/Agreement.js')
    const { createCsrfToken } = await import('../src/middleware/csrf.middleware.js')
    await Promise.all([Agreement.init(), Payment.init(), Project.init(), Provider.init(), User.init()])

    const runId = randomUUID()
    const [clientA, clientB] = await Promise.all(['a', 'b'].map((suffix) => User.create({
      name: `Razorpay API ${suffix}`,
      email: `razorpay-api-${runId}-${suffix}@example.test`,
      passwordHash: 'integration-test-hash',
    })))
    createdIds.users.push(clientA._id, clientB._id)

    const provider = await Provider.create({
      displayName: `Razorpay demo ${runId}`,
      initials: 'RD',
      specialty: 'Testing',
      skills: ['Node.js'],
      experienceYears: 1,
      proposedBudget: 123.45,
      delivery: '1–2 weeks',
      deliveryMaxWeeks: 2,
      portfolio: 'Fictional test profile',
      profileStatus: 'Illustrative demo profile',
      isDemo: true,
    })
    createdIds.providers.push(provider._id)

    const project = await Project.create({
      owner: clientA._id,
      title: 'Razorpay test project',
      description: 'A disposable project for isolated Razorpay payment API tests.',
      category: 'Web Development',
      budget: 1000,
      timeline: '1–2 weeks',
      skills: ['Node.js'],
      selectedProviderId: provider._id,
    })
    createdIds.projects.push(project._id)

    const snapshot = createAgreementSnapshot({
      price: 123.45,
      timeline: '1–2 weeks',
      deliverables: ['Demo implementation'],
      milestones: [{ name: 'Delivery', description: 'Complete demo', percentageBps: 10000 }],
      projectContext: {
        title: project.title,
        category: project.category,
        description: project.description,
      },
      providerContext: {
        displayName: provider.displayName,
        specialty: provider.specialty,
        profileStatus: provider.profileStatus,
      },
    })
    const agreement = await Agreement.create({
      project: project._id,
      client: clientA._id,
      provider: provider._id,
      version: 1,
      status: 'draft',
      snapshot,
    })
    createdIds.agreements.push(agreement._id)

    function authContext(user) {
      const token = jwt.sign({ sub: user.id }, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '10m',
      })
      return {
        token,
        csrfToken: createCsrfToken({ cookies: { dealflow_token: token } }),
      }
    }
    const authA = authContext(clientA)
    const authB = authContext(clientB)

    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, () => resolve(listener))
      listener.once('error', reject)
    })
    const baseUrl = `http://127.0.0.1:${server.address().port}`

    let orderCalls = 0
    let paymentFetchCalls = 0
    let orderTimeoutTriggered = false
    let receiptLookupCalls = 0
    let uncertainReceipt
    originalFetch = globalThis.fetch
    globalThis.fetch = async (url, options) => {
      const target = String(url)
      assert.match(options.headers.Authorization, /^Basic /)
      if (target.endsWith('/orders') && options.method === 'POST') {
        orderCalls += 1
        const order = JSON.parse(options.body)
        if (orderCalls === 2) {
          uncertainReceipt = order.receipt
          orderTimeoutTriggered = true
          const timeout = new Error('simulated timeout')
          timeout.name = 'AbortError'
          throw timeout
        }
        return razorpayResponse({
          id: 'order_test123',
          entity: 'order',
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: 'created',
        })
      }
      if (target.includes('/orders?receipt=')) {
        const receipt = new URL(target).searchParams.get('receipt')
        receiptLookupCalls += 1
        return razorpayResponse({
          items: receipt === uncertainReceipt && orderTimeoutTriggered && receiptLookupCalls > 1
            ? [{
              id: 'order_testreconciled',
              entity: 'order',
              amount: 12345,
              currency: 'INR',
              receipt,
              status: 'created',
            }]
            : [],
        })
      }
      if (target.endsWith('/payments/pay_test123') && options.method === 'GET') {
        paymentFetchCalls += 1
        return razorpayResponse({
          id: 'pay_test123',
          order_id: 'order_test123',
          amount: 12345,
          currency: 'INR',
          status: 'captured',
          captured: true,
          created_at: 1700000000,
        })
      }
      throw new Error(`Unexpected mocked Razorpay URL: ${target}`)
    }

    const orderPath = `/api/agreements/${agreement.id}/payments/razorpay/order`
    assert.equal((await requestJson(baseUrl, orderPath, { method: 'POST' })).status, 401)
    assert.equal((await requestJson(baseUrl, orderPath, {
      method: 'POST',
      user: authB,
      csrfToken: authB.csrfToken,
    })).status, 404)
    assert.equal((await requestJson(baseUrl, orderPath, {
      method: 'POST',
      user: authA,
      origin: 'https://invalid.example',
      csrfToken: authA.csrfToken,
    })).status, 403)
    assert.equal((await requestJson(baseUrl, orderPath, {
      method: 'POST',
      user: authA,
      csrfToken: 'invalid',
    })).status, 403)

    const orderResults = await Promise.all([
      requestJson(baseUrl, orderPath, {
        method: 'POST',
        user: authA,
        csrfToken: authA.csrfToken,
        payload: { amount: 1, currency: 'USD', receipt: 'browser-receipt' },
      }),
      requestJson(baseUrl, orderPath, {
        method: 'POST',
        user: authA,
        csrfToken: authA.csrfToken,
      }),
    ])
    assert.ok(
  orderResults.every((result) => result.status === 200 || result.status === 201),
  `Unexpected concurrent order responses: ${JSON.stringify(orderResults)}`,
)
    assert.ok(orderResults.every((result) => result.data.data.orderId === 'order_test123'))
    assert.ok(orderResults.every((result) => result.data.data.keyId === 'rzp_test_integration'))
    assert.equal(orderCalls, 1)

    const payment = await Payment.findOne({ agreement: agreement._id })
    createdIds.payments.push(payment._id)
    assert.equal(payment.amountMinor, 12345)
    assert.equal(payment.currency, 'INR')
    assert.equal(payment.mode, 'razorpay_test_demo')
    assert.equal(payment.status, 'order_created')

    const statusPath = `/api/payments/${payment.id}`
    assert.equal((await requestJson(baseUrl, statusPath, { user: authB })).status, 404)
    const ownStatus = await requestJson(baseUrl, statusPath, { user: authA })
    assert.equal(ownStatus.status, 200)
    assert.equal('razorpayOrderId' in ownStatus.data.data, false)
    assert.equal('razorpayPaymentId' in ownStatus.data.data, false)

    const signature = createHmac('sha256', razorpaySecret)
      .update('order_test123|pay_test123')
      .digest('hex')
    const verificationPath = `/api/payments/${payment.id}/razorpay/verify`
    assert.equal((await requestJson(baseUrl, verificationPath, { method: 'POST' })).status, 401)
    assert.equal((await requestJson(baseUrl, verificationPath, {
      method: 'POST',
      user: authB,
      csrfToken: authB.csrfToken,
      payload: {
        razorpay_payment_id: 'pay_test123',
        razorpay_order_id: 'order_test123',
        razorpay_signature: signature,
      },
    })).status, 404)
    assert.equal((await requestJson(baseUrl, verificationPath, {
      method: 'POST',
      user: authA,
      origin: 'https://invalid.example',
      csrfToken: authA.csrfToken,
    })).status, 403)
    assert.equal((await requestJson(baseUrl, verificationPath, {
      method: 'POST',
      user: authA,
      csrfToken: 'invalid',
    })).status, 403)

    const payload = {
      razorpay_payment_id: 'pay_test123',
      razorpay_order_id: 'order_test123',
      razorpay_signature: signature,
      amount: 1,
      currency: 'USD',
    }
    const verified = await requestJson(baseUrl, verificationPath, {
      method: 'POST',
      user: authA,
      csrfToken: authA.csrfToken,
      payload,
    })
    assert.equal(verified.status, 200)
    assert.equal(verified.data.data.status, 'completed')
    assert.equal(paymentFetchCalls, 1)
    const repeated = await requestJson(baseUrl, verificationPath, {
      method: 'POST',
      user: authA,
      csrfToken: authA.csrfToken,
      payload,
    })
    assert.equal(repeated.status, 200)
    assert.equal(repeated.data.data.status, 'completed')
    assert.equal(paymentFetchCalls, 1)
    assert.equal((await Payment.findById(payment._id)).status, 'completed')
    assert.equal((await Agreement.findById(agreement._id)).status, 'draft')
    assert.equal((await Agreement.findById(agreement._id)).acceptances?.provider, undefined)

    const secondProject = await Project.create({
      owner: clientA._id,
      title: 'Razorpay uncertain-order test',
      description: 'A disposable project for uncertain order creation reconciliation.',
      category: 'Web Development',
      budget: 1000,
      timeline: '1–2 weeks',
      skills: ['Node.js'],
      selectedProviderId: provider._id,
    })
    createdIds.projects.push(secondProject._id)
    const secondAgreement = await Agreement.create({
      project: secondProject._id,
      client: clientA._id,
      provider: provider._id,
      version: 1,
      status: 'draft',
      snapshot: createAgreementSnapshot({
        price: 123.45,
        timeline: '1–2 weeks',
        deliverables: ['Demo implementation'],
        milestones: [{ name: 'Delivery', description: 'Complete demo', percentageBps: 10000 }],
        projectContext: {
          title: secondProject.title,
          category: secondProject.category,
          description: secondProject.description,
        },
        providerContext: {
          displayName: provider.displayName,
          specialty: provider.specialty,
          profileStatus: provider.profileStatus,
        },
      }),
    })
    createdIds.agreements.push(secondAgreement._id)
    const secondOrderPath = `/api/agreements/${secondAgreement.id}/payments/razorpay/order`
    const timedOutOrder = await requestJson(baseUrl, secondOrderPath, {
      method: 'POST',
      user: authA,
      csrfToken: authA.csrfToken,
    })
    assert.equal(timedOutOrder.status, 502)
    const uncertainPayment = await Payment.findOne({ agreement: secondAgreement._id })
    createdIds.payments.push(uncertainPayment._id)
    assert.equal(uncertainPayment.status, 'unknown')

    const noReceiptMatch = await requestJson(baseUrl, secondOrderPath, {
      method: 'POST',
      user: authA,
      csrfToken: authA.csrfToken,
    })
    assert.equal(noReceiptMatch.status, 202)
    assert.equal(orderCalls, 2)

    const reconciledOrder = await requestJson(baseUrl, secondOrderPath, {
      method: 'POST',
      user: authA,
      csrfToken: authA.csrfToken,
    })
    assert.equal(reconciledOrder.status, 200)
    assert.equal(reconciledOrder.data.data.orderId, 'order_testreconciled')
    assert.equal(orderCalls, 2)
    assert.equal((await Payment.findById(uncertainPayment._id)).status, 'order_created')
  } finally {
    if (originalFetch) globalThis.fetch = originalFetch
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
    if (mongoose.connection.readyState !== 0) {
      if (createdIds.agreements.length) {
        await Payment.deleteMany({ agreement: { $in: createdIds.agreements } })
      }
      if (createdIds.payments.length) await Payment.deleteMany({ _id: { $in: createdIds.payments } })
      if (createdIds.agreements.length) await Agreement.deleteMany({ _id: { $in: createdIds.agreements } })
      if (createdIds.projects.length) await Project.deleteMany({ _id: { $in: createdIds.projects } })
      if (createdIds.providers.length) await Provider.deleteMany({ _id: { $in: createdIds.providers } })
      if (createdIds.users.length) await User.deleteMany({ _id: { $in: createdIds.users } })
      await mongoose.disconnect()
    }
  }
})
