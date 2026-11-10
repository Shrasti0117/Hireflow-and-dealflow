import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test, { after, before } from 'node:test'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import app from '../src/app.js'
import { createCsrfToken } from '../src/middleware/csrf.middleware.js'
import Project from '../src/models/Project.js'
import Provider from '../src/models/Provider.js'
import User from '../src/models/User.js'

const testRunId = randomUUID()
const idempotencyKeys = new Set()
const users = []
let providerId
let server
let baseUrl

function projectPayload(title = 'Idempotent project integration test') {
  return {
    title,
    description: 'A disposable project used to verify safe idempotent project creation.',
    category: 'Web Development',
    budget: 25000,
    timeline: '1–2 months',
    skills: ['React', 'Node.js'],
  }
}

function createRequestContext(user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET.trim(), {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
  const csrfToken = createCsrfToken({ cookies: { dealflow_token: token } })
  return {
    cookie: `dealflow_token=${token}; dealflow_csrf=${csrfToken}`,
    csrfToken,
  }
}

async function request(path, { user, key, payload, csrf = true, method = 'POST', headers = {} } = {}) {
  const requestHeaders = {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  }
  if (user) {
    const context = createRequestContext(user)
    requestHeaders.cookie = context.cookie
    if (csrf) requestHeaders['x-csrf-token'] = context.csrfToken
  }
  if (key !== undefined) requestHeaders['Idempotency-Key'] = key
  if (payload !== undefined) requestHeaders['Content-Type'] = 'application/json'
  Object.assign(requestHeaders, headers)

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  const data = await response.json()
  if (typeof key === 'string' && typeof data?.data?._id === 'string') {
    idempotencyKeys.add(key)
  }
  return { response, data }
}

before(async () => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET?.trim()) {
    throw new Error('Integration tests require configured MongoDB and JWT settings.')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  await Project.init()

  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, () => resolve(listener))
    listener.once('error', reject)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`

  for (const suffix of ['a', 'b']) {
    const user = await User.create({
      name: `Idempotency Test ${suffix}`,
      email: `dealflow-idempotency-${testRunId}-${suffix}@example.test`,
      passwordHash: await argon2.hash(randomUUID()),
    })
    users.push(user)
  }

  const provider = await Provider.create({
    displayName: `Idempotency Test Provider ${testRunId}`,
    initials: 'IT',
    specialty: 'Integration testing',
    skills: ['React'],
    experienceYears: 1,
    proposedBudget: 25000,
    delivery: '1–2 months',
    deliveryMaxWeeks: 8,
    portfolio: 'Test-only portfolio',
    profileStatus: 'available',
    isDemo: true,
  })
  providerId = provider._id

  process.env.FRONTEND_ORIGIN = origin
})

after(async () => {
  try {
    if (users.length > 0) {
      const ownerIds = users.map((user) => user._id)
      const projectFilter = { owner: { $in: ownerIds } }
      if (idempotencyKeys.size > 0) projectFilter.idempotencyKey = { $in: [...idempotencyKeys] }
      await Project.deleteMany(projectFilter)
      await User.deleteMany({ _id: { $in: ownerIds } })
    }
    if (providerId) await Provider.deleteOne({ _id: providerId })
  } finally {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
  }
})

test('project creation is idempotent and preserves existing protections', async (t) => {
  const [userA, userB] = users
  const sharedKey = randomUUID()
  const conflictKey = randomUUID()
  const concurrentKey = randomUUID()
  idempotencyKeys.add(sharedKey)
  idempotencyKeys.add(conflictKey)
  idempotencyKeys.add(concurrentKey)

  let projectId

  await t.test('requires authentication, CSRF, and a valid idempotency key', async () => {
    const unauthenticated = await request('/api/projects', { key: randomUUID(), payload: projectPayload() })
    assert.equal(unauthenticated.response.status, 401)

    const invalidCsrf = await request('/api/projects', {
      user: userA,
      key: randomUUID(),
      payload: projectPayload(),
      headers: { 'x-csrf-token': 'invalid' },
    })
    assert.equal(invalidCsrf.response.status, 403)

    const invalidOrigin = await request('/api/projects', {
      user: userA,
      key: randomUUID(),
      payload: projectPayload(),
      headers: { origin: 'https://invalid.example' },
    })
    assert.equal(invalidOrigin.response.status, 403)

    const missingKey = await request('/api/projects', { user: userA, payload: projectPayload() })
    assert.equal(missingKey.response.status, 400)

    const malformedKey = await request('/api/projects', { user: userA, key: 'not-a-uuid', payload: projectPayload() })
    assert.equal(malformedKey.response.status, 400)
  })

  await t.test('creates once and replays the original response for the same key and payload', async () => {
    const payload = projectPayload()
    const first = await request('/api/projects', { user: userA, key: sharedKey, payload })
    assert.equal(first.response.status, 201)
    assert.equal(first.data.success, true)
    assert.equal(first.data.data.owner, String(userA._id))
    assert.equal('idempotencyKey' in first.data.data, false)
    assert.equal('idempotencyFingerprint' in first.data.data, false)
    projectId = first.data.data._id

    const retry = await request('/api/projects', { user: userA, key: sharedKey, payload })
    assert.equal(retry.response.status, 200)
    assert.equal(retry.data.data._id, projectId)
    assert.equal(await Project.countDocuments({ owner: userA._id, idempotencyKey: sharedKey }), 1)
  })

  await t.test('rejects reuse of a key with a different payload', async () => {
    const first = await request('/api/projects', {
      user: userA,
      key: conflictKey,
      payload: projectPayload('Original title'),
    })
    assert.equal(first.response.status, 201)
    const conflict = await request('/api/projects', {
      user: userA,
      key: conflictKey,
      payload: projectPayload('Changed title'),
    })
    assert.equal(conflict.response.status, 409)
    assert.equal(conflict.data.error, 'This Idempotency-Key was already used with a different project request.')
  })

  await t.test('concurrent duplicate requests create only one project', async () => {
    const results = await Promise.all([
      request('/api/projects', { user: userA, key: concurrentKey, payload: projectPayload('Concurrent project') }),
      request('/api/projects', { user: userA, key: concurrentKey, payload: projectPayload('Concurrent project') }),
    ])
    assert.deepEqual(results.map(({ response }) => response.status).sort(), [200, 201])
    assert.equal(results[0].data.data._id, results[1].data.data._id)
    assert.equal(await Project.countDocuments({ owner: userA._id, idempotencyKey: concurrentKey }), 1)
  })

  await t.test('scopes identical keys to each authenticated owner', async () => {
    const userBProject = await request('/api/projects', {
      user: userB,
      key: sharedKey,
      payload: projectPayload('User B independent project'),
    })
    assert.equal(userBProject.response.status, 201)
    assert.notEqual(userBProject.data.data._id, projectId)

    const userBList = await request('/api/projects', { user: userB, method: 'GET' })
    assert.equal(userBList.response.status, 200)
    assert.deepEqual(userBList.data.data.map((project) => project._id), [userBProject.data.data._id])

    const crossOwnerFetch = await request(`/api/projects/${projectId}`, { user: userB, method: 'GET' })
    assert.equal(crossOwnerFetch.response.status, 404)
  })

  await t.test('project listing, provider selection, negotiation, and agreement preview still work', async () => {
    const userAList = await request('/api/projects', { user: userA, method: 'GET' })
    assert.equal(userAList.response.status, 200)
    assert.ok(userAList.data.data.some((project) => project._id === projectId))

    const providerSelection = await request(`/api/projects/${projectId}/provider`, {
      user: userA,
      method: 'PATCH',
      payload: { providerId: String(providerId) },
    })
    assert.equal(providerSelection.response.status, 200)

    const negotiation = await request(`/api/projects/${projectId}/negotiation`, {
      user: userA,
      method: 'PATCH',
      payload: {
        price: 25000,
        timeline: '1–2 months',
        deliverables: ['Implementation', 'Testing'],
        milestones: [
          { name: 'Implementation', description: 'Build the project', percentage: 60 },
          { name: 'Testing', description: 'Verify the project', percentage: 40 },
        ],
      },
    })
    assert.equal(negotiation.response.status, 200)

    const agreement = await request(`/api/projects/${projectId}/agreement-preview`, {
      user: userA,
      method: 'PATCH',
    })
    assert.equal(agreement.response.status, 200)
    assert.match(agreement.data.data.agreementPreview.previewReference, /^DF-PREVIEW-/)
  })
})
