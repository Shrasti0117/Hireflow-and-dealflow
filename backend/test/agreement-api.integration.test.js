import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const mongoUri = process.env.AGREEMENT_API_TEST_MONGODB_URI
const jwtSecret = process.env.AGREEMENT_API_TEST_JWT_SECRET
const testEnabled = Boolean(mongoUri && jwtSecret)

test('agreement draft API enforces ownership and allocates versions safely', {
  skip: !testEnabled,
}, async (t) => {
  const parsedMongoUri = new URL(mongoUri)
  const databaseName = decodeURIComponent(parsedMongoUri.pathname.replace(/^\/+/, ''))
  assert.match(databaseName, /test/i, 'AGREEMENT_API_TEST_MONGODB_URI must target a test database')

  const origin = 'http://localhost:5173'
  process.env.JWT_SECRET = jwtSecret
  process.env.FRONTEND_ORIGIN = origin

  let app
  let createCsrfToken
  let Agreement
  let Project
  let Provider
  let User
  let server
  let baseUrl
  const createdUsers = []
  const createdProjectIds = []
  const createdProviderIds = []
  let userA
  let userB
  let provider
  let alternateProvider
  let validProject
  let concurrentProject
  let ambiguousProject
  let missingProviderProject
  let missingSelectionProject
  let missingNegotiationProject
  let agreementId

  try {
    await mongoose.connect(mongoUri)
    ;({ default: Agreement } = await import('../src/models/Agreement.js'))
    ;({ default: Project } = await import('../src/models/Project.js'))
    ;({ default: Provider } = await import('../src/models/Provider.js'))
    ;({ default: User } = await import('../src/models/User.js'))
    ;({ default: app } = await import('../src/app.js'))
    ;({ createCsrfToken } = await import('../src/middleware/csrf.middleware.js'))

    await Promise.all([
      Agreement.init(),
      Project.init(),
      User.init(),
      Provider.init(),
    ])

    const runId = randomUUID()
    userA = await User.create({
      name: 'Agreement API test A',
      email: `agreement-api-${runId}-a@example.test`,
      passwordHash: 'integration-test-hash',
    })
    createdUsers.push(userA)
    userB = await User.create({
      name: 'Agreement API test B',
      email: `agreement-api-${runId}-b@example.test`,
      passwordHash: 'integration-test-hash',
    })
    createdUsers.push(userB)

    provider = await Provider.create({
      displayName: `Agreement API test provider ${runId}`,
      initials: 'AT',
      specialty: 'Integration testing',
      skills: ['Node.js'],
      experienceYears: 1,
      proposedBudget: 1000,
      delivery: '3–4 weeks',
      deliveryMaxWeeks: 4,
      portfolio: 'Test-only portfolio',
      profileStatus: 'available',
      isDemo: true,
    })
    createdProviderIds.push(provider._id)
    alternateProvider = await Provider.create({
      displayName: `Agreement API alternate provider ${runId}`,
      initials: 'AA',
      specialty: 'Alternate integration testing',
      skills: ['Node.js'],
      experienceYears: 2,
      proposedBudget: 1200,
      delivery: '3–4 weeks',
      deliveryMaxWeeks: 4,
      portfolio: 'Test-only alternate portfolio',
      profileStatus: 'available',
      isDemo: true,
    })
    createdProviderIds.push(alternateProvider._id)

    async function createProject(owner, { selectProvider = true, saveNegotiation = true } = {}) {
      const project = await Project.create({
        owner: owner._id,
        title: `Agreement API project ${runId}`,
        description: 'A disposable project for agreement API integration tests.',
        category: 'Web Development',
        budget: 100000,
        timeline: '1–2 months',
        skills: ['Node.js'],
        ...(selectProvider ? { selectedProviderId: provider._id } : {}),
        ...(saveNegotiation ? {
          negotiation: {
            price: 1000.01,
            timeline: '3–4 weeks',
            deliverables: ['Completed implementation'],
            milestones: [
              { name: 'Build', description: 'Implement the work', percentage: 33.33 },
              { name: 'Review', description: 'Review the work', percentage: 33.33 },
              { name: 'Handover', description: 'Hand over the work', percentage: 33.34 },
            ],
            updatedAt: new Date(),
          },
        } : {}),
      })
      createdProjectIds.push(project._id)
      return project
    }

    validProject = await createProject(userA)
    concurrentProject = await createProject(userA)
    ambiguousProject = await createProject(userA)
    missingSelectionProject = await createProject(userA, { selectProvider: false })
    missingNegotiationProject = await createProject(userA, { saveNegotiation: false })
    missingProviderProject = await createProject(userA)
    missingProviderProject.selectedProviderId = new mongoose.Types.ObjectId()
    await missingProviderProject.save()

    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, () => resolve(listener))
      listener.once('error', reject)
    })
    baseUrl = `http://127.0.0.1:${server.address().port}`

    function authHeaders(user, { csrf = true, requestOrigin = origin } = {}) {
      const headers = { origin: requestOrigin }
      if (!user) return headers

      const token = jwt.sign(
        { role: 'client' },
        jwtSecret,
        { algorithm: 'HS256', subject: user.id, expiresIn: '10m' },
      )
      const csrfToken = createCsrfToken({ cookies: { dealflow_token: token } })
      headers.cookie = `dealflow_token=${token}; dealflow_csrf=${csrfToken}`
      if (csrf) headers['x-csrf-token'] = csrfToken
      return headers
    }

    async function request(path, {
      user,
      method = 'GET',
      payload,
      csrf = true,
      requestOrigin = origin,
      headers = {},
    } = {}) {
      const requestHeaders = {
        ...authHeaders(user, { csrf, requestOrigin }),
        ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      }
      const result = await fetch(`${baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: payload === undefined ? undefined : JSON.stringify(payload),
      })
      return { response: result, data: await result.json() }
    }

    await t.test('requires authentication, valid Origin, and CSRF on draft creation', async () => {
      const unauthenticated = await request(`/api/projects/${validProject.id}/agreements`, {
        method: 'POST',
      })
      assert.equal(unauthenticated.response.status, 401)

      const invalidCsrf = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
        csrf: false,
      })
      assert.equal(invalidCsrf.response.status, 403)

      const invalidOrigin = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
        requestOrigin: 'https://invalid.example',
      })
      assert.equal(invalidOrigin.response.status, 403)
    })

    await t.test('creates a server-derived draft and ignores client-supplied identity and snapshot data', async () => {
      const fakeProviderId = new mongoose.Types.ObjectId()
      const fakeClientId = new mongoose.Types.ObjectId()
      const result = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
        payload: {
          client: String(fakeClientId),
          provider: String(fakeProviderId),
          providerUser: String(fakeProviderId),
          version: 999,
          status: 'accepted',
          snapshot: {
            currency: 'USD',
            totalAmountMinor: 1,
            hash: '0'.repeat(64),
          },
        },
      })

      assert.equal(result.response.status, 201)
      assert.equal(result.data.success, true)
      assert.equal(result.data.data.project, String(validProject._id))
      assert.equal(result.data.data.client, String(userA._id))
      assert.equal(result.data.data.provider, String(provider._id))
      assert.equal('providerUser' in result.data.data, false)
      assert.equal(result.data.data.version, 1)
      assert.equal(result.data.data.status, 'draft')
      assert.equal(result.data.data.snapshot.currency, 'INR')
      assert.equal(result.data.data.snapshot.totalAmountMinor, 100001)
      assert.equal(result.data.data.snapshot.terms.priceMinor, 100001)
      assert.deepEqual(
        result.data.data.snapshot.terms.milestones.map((milestone) => milestone.amountMinor),
        [33330, 33330, 33341],
      )
      assert.equal(
        result.data.data.snapshot.terms.milestones.reduce((sum, milestone) => sum + milestone.amountMinor, 0),
        100001,
      )
      assert.notEqual(result.data.data.snapshot.hash, '0'.repeat(64))
      assert.equal(result.data.data.snapshot.terms.projectContext.title, validProject.title)
      agreementId = result.data.data._id
    })

    await t.test('reuses an existing draft for repeated requests with the same snapshot', async () => {
      const repeated = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(repeated.response.status, 200)
      assert.equal(repeated.data.data._id, agreementId)
      assert.equal(repeated.data.data.version, 1)
      assert.equal(await Agreement.countDocuments({ project: validProject._id }), 1)
    })

    await t.test('reuses the draft when the client retries after discarding the original response', async () => {
      await request(`/api/projects/${ambiguousProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      const ambiguousRetry = await request(`/api/projects/${ambiguousProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(ambiguousRetry.response.status, 200)
      assert.equal(ambiguousRetry.data.data.version, 1)
      assert.equal(await Agreement.countDocuments({ project: ambiguousProject._id }), 1)
    })

    await t.test('returns 404 for another client creating or reading the agreement', async () => {
      const createResult = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userB,
        method: 'POST',
      })
      assert.equal(createResult.response.status, 404)

      const readResult = await request(`/api/agreements/${agreementId}`, { user: userB })
      assert.equal(readResult.response.status, 404)
    })

    await t.test('allows the project owner to read the snapshot and lifecycle status', async () => {
      const result = await request(`/api/agreements/${agreementId}`, { user: userA })

      assert.equal(result.response.status, 200)
      assert.equal(result.data.data._id, agreementId)
      assert.equal(result.data.data.status, 'draft')
      assert.equal(result.data.data.snapshot.hash.length, 64)
      assert.equal('passwordHash' in result.data.data, false)
    })

    await t.test('rejects invalid IDs, missing provider selection, negotiation, or provider records', async () => {
      const invalidId = await request('/api/projects/not-an-id/agreements', {
        user: userA,
        method: 'POST',
      })
      assert.equal(invalidId.response.status, 400)

      const noSelection = await request(`/api/projects/${missingSelectionProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(noSelection.response.status, 409)

      const noNegotiation = await request(`/api/projects/${missingNegotiationProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(noNegotiation.response.status, 409)

      const missingProvider = await request(`/api/projects/${missingProviderProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(missingProvider.response.status, 404)
    })

    await t.test('prevents concurrent duplicate drafts for an identical persisted snapshot', async () => {
      const concurrent = await Promise.all([
        request(`/api/projects/${concurrentProject.id}/agreements`, { user: userA, method: 'POST' }),
        request(`/api/projects/${concurrentProject.id}/agreements`, { user: userA, method: 'POST' }),
      ])
      assert.deepEqual(concurrent.map((item) => item.response.status).sort(), [200, 201])
      assert.equal(concurrent[0].data.data._id, concurrent[1].data.data._id)
      assert.equal(await Agreement.countDocuments({ project: concurrentProject._id }), 1)
    })

    await t.test('creates a new version when negotiation terms or selected provider change', async () => {
      validProject.negotiation.price = 1100.01
      await validProject.save()
      const changedTerms = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(changedTerms.response.status, 201)
      assert.equal(changedTerms.data.data.version, 2)
      assert.notEqual(changedTerms.data.data._id, agreementId)
      assert.equal(changedTerms.data.data.snapshot.totalAmountMinor, 110001)

      validProject.selectedProviderId = alternateProvider._id
      await validProject.save()
      const changedProvider = await request(`/api/projects/${validProject.id}/agreements`, {
        user: userA,
        method: 'POST',
      })
      assert.equal(changedProvider.response.status, 201)
      assert.equal(changedProvider.data.data.version, 3)
      assert.equal(changedProvider.data.data.provider, String(alternateProvider._id))
      assert.equal(await Agreement.countDocuments({ project: validProject._id }), 3)
    })

    await t.test('preserves preview-only, public provider, and health routes', async () => {
      const preview = await request(`/api/projects/${validProject.id}/agreement-preview`, {
        user: userA,
        method: 'PATCH',
        payload: {},
      })
      assert.equal(preview.response.status, 200)
      assert.equal(preview.data.data.agreementPreview.status, 'PREVIEW_ONLY')
      assert.equal(await Agreement.countDocuments({ project: validProject._id }), 3)

      const providers = await request('/api/providers')
      assert.equal(providers.response.status, 200)
      assert.ok(providers.data.data.some((item) => item._id === String(provider._id)))

      const health = await request('/api/health')
      assert.equal(health.response.status, 200)
    })
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }

    if (mongoose.connection.readyState !== 0) {
      if (createdProjectIds.length > 0 && createdUsers.length > 0) {
        const ownedProjects = await Project.find({
          _id: { $in: createdProjectIds },
          owner: { $in: createdUsers.map((user) => user._id) },
        }).select('_id owner')
        const ownedProjectIds = ownedProjects.map((project) => project._id)
        if (ownedProjectIds.length > 0) {
          await Agreement.deleteMany({
            project: { $in: ownedProjectIds },
            client: { $in: createdUsers.map((user) => user._id) },
          })
          await Project.deleteMany({
            _id: { $in: ownedProjectIds },
            owner: { $in: createdUsers.map((user) => user._id) },
          })
        }
      }
      if (createdProviderIds.length > 0) {
        await Provider.deleteMany({ _id: { $in: createdProviderIds } })
      }
      if (createdUsers.length > 0) {
        await User.deleteMany({ _id: { $in: createdUsers.map((user) => user._id) } })
      }
      await mongoose.disconnect()
    }
  }
})
