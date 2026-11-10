import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Agreement, {
  createAgreementSnapshot,
  hashSnapshotData,
  rupeesToPaise,
} from '../src/models/Agreement.js'

const agreementRefs = {
  project: new mongoose.Types.ObjectId(),
  client: new mongoose.Types.ObjectId(),
  provider: new mongoose.Types.ObjectId(),
}

function createSnapshot(overrides = {}) {
  return createAgreementSnapshot({
    price: 100.01,
    timeline: '3–4 weeks',
    deliverables: ['Completed implementation'],
    milestones: [
      { name: 'Build', description: 'Implement the work', percentageBps: 3333 },
      { name: 'Review', description: 'Review the work', percentageBps: 3333 },
      { name: 'Handover', description: 'Hand over the work', percentageBps: 3334 },
    ],
    projectContext: {
      title: 'Test project',
      category: 'Web Development',
      description: 'A project used for Agreement model validation tests.',
    },
    providerContext: {
      displayName: 'Demo provider',
      specialty: 'Web Development',
      profileStatus: 'demo',
    },
    ...overrides,
  })
}

function createAgreement(snapshot, overrides = {}) {
  return new Agreement({
    ...agreementRefs,
    version: 1,
    snapshot,
    ...overrides,
  })
}

function findAgreementIndex(key, name) {
  return Agreement.schema.indexes().find(([indexKey, options]) => (
    JSON.stringify(indexKey) === JSON.stringify(key) && options.name === name
  ))
}

test('builds a valid INR agreement snapshot with integer paise amounts', () => {
  const snapshot = createSnapshot()
  const agreement = createAgreement(snapshot)

  assert.equal(agreement.validateSync(), undefined)
  assert.equal(snapshot.currency, 'INR')
  assert.equal(snapshot.totalAmountMinor, 10001)
  assert.equal(snapshot.terms.priceMinor, 10001)
  assert.equal(snapshot.hash, hashSnapshotData(snapshot))
  assert.ok(snapshot.terms.milestones.every((milestone) => Number.isSafeInteger(milestone.amountMinor)))
  assert.equal(
    snapshot.terms.milestones.reduce((total, milestone) => total + milestone.amountMinor, 0),
    snapshot.totalAmountMinor,
  )
})

test('converts only positive rupee amounts representable in safe whole paise', () => {
  assert.equal(rupeesToPaise(0.01), 1)
  assert.equal(rupeesToPaise(100.01), 10001)
  for (const invalidPrice of [0, -0.01, Number.NaN, Number.POSITIVE_INFINITY, 90071992547410, 1.001]) {
    assert.throws(() => rupeesToPaise(invalidPrice), TypeError)
  }
})

test('rejects invalid milestone percentages and percentages not totaling 10000 bps', () => {
  assert.throws(() => createSnapshot({
    milestones: [{ name: 'Build', description: 'Build it', percentageBps: 5000.5 }],
  }), /integer basis-point percentages/)
  assert.throws(() => createSnapshot({
    milestones: [{ name: 'Build', description: 'Build it', percentageBps: 9999 }],
  }), /total exactly 10000/)
  assert.throws(() => createSnapshot({
    milestones: [{ name: 'Build', description: 'Build it', percentageBps: 10001 }],
  }), /integer basis-point percentages/)
  assert.throws(() => createSnapshot({
    milestones: [
      { name: 'Build', description: 'Build it', percentageBps: 1 },
      { name: 'Handover', description: 'Hand it over', percentageBps: 9999 },
    ],
    price: 0.01,
  }), /Every milestone must receive a positive safe-integer amount/)
})

test('allocates rounding remainder to the final milestone and ignores supplied amounts', () => {
  const snapshot = createSnapshot({
    milestones: [
      { name: 'Build', description: 'Implement the work', percentageBps: 3333, amountMinor: 1 },
      { name: 'Review', description: 'Review the work', percentageBps: 3333, amountMinor: 1 },
      { name: 'Handover', description: 'Hand over the work', percentageBps: 3334, amountMinor: 999999 },
    ],
  })

  assert.deepEqual(
    snapshot.terms.milestones.map((milestone) => milestone.amountMinor),
    [3333, 3333, 3335],
  )
  assert.equal(snapshot.terms.milestones.reduce((sum, milestone) => sum + milestone.amountMinor, 0), 10001)

  const invalidPersistedSnapshot = structuredClone(snapshot)
  invalidPersistedSnapshot.terms.milestones[0].amountMinor += 1
  invalidPersistedSnapshot.hash = hashSnapshotData(invalidPersistedSnapshot)
  const invalidAgreement = createAgreement(invalidPersistedSnapshot)
  assert.ok(invalidAgreement.validateSync()?.errors.snapshot)
})

test('rejects unsupported currency and unsafe persisted monetary values', () => {
  const invalidCurrency = structuredClone(createSnapshot())
  invalidCurrency.currency = 'USD'
  invalidCurrency.hash = hashSnapshotData(invalidCurrency)
  assert.ok(createAgreement(invalidCurrency).validateSync()?.errors.snapshot)

  for (const invalidAmount of [0, -1, Number.MAX_SAFE_INTEGER + 1, 1.5]) {
    const invalidSnapshot = structuredClone(createSnapshot())
    invalidSnapshot.totalAmountMinor = invalidAmount
    invalidSnapshot.terms.priceMinor = invalidAmount
    invalidSnapshot.hash = hashSnapshotData(invalidSnapshot)
    assert.ok(createAgreement(invalidSnapshot).validateSync()?.errors.snapshot)
  }
})

test('declares unique project-version, pending, and draft-fingerprint indexes', () => {
  const versionIndex = findAgreementIndex(
    { project: 1, version: 1 },
    'unique_agreement_version_per_project',
  )
  const draftFingerprintIndex = findAgreementIndex(
    { project: 1, draftFingerprint: 1 },
    'unique_draft_agreement_per_project_fingerprint',
  )
  const pendingIndex = findAgreementIndex(
    { project: 1 },
    'unique_pending_agreement_per_project',
  )

  assert.equal(versionIndex?.[1].unique, true)
  assert.equal(draftFingerprintIndex?.[1].unique, true)
  assert.deepEqual(draftFingerprintIndex?.[1].partialFilterExpression, {
    status: 'draft',
    draftFingerprint: { $type: 'string' },
  })
  assert.equal(pendingIndex?.[1].unique, true)
  assert.deepEqual(pendingIndex?.[1].partialFilterExpression, {
    status: 'pending_provider_acceptance',
  })

  test('keeps the server-generated draft fingerprint out of Agreement responses by default', () => {
    const fingerprintPath = Agreement.schema.path('draftFingerprint')
    assert.equal(fingerprintPath.options.select, false)
    assert.equal(fingerprintPath.options.immutable, true)
  })
})

test('allows an Agreement without a providerUser account link', () => {
  const agreement = createAgreement(createSnapshot())

  assert.equal(agreement.providerUser, undefined)
  assert.equal(agreement.validateSync(), undefined)
})

const agreementTestMongoUri = process.env.AGREEMENT_TEST_MONGODB_URI

test('MongoDB unique indexes reject duplicate project versions, pending agreements, and draft fingerprints', {
  skip: !agreementTestMongoUri,
}, async () => {
  await mongoose.connect(agreementTestMongoUri)
  const projectId = new mongoose.Types.ObjectId()
  const snapshot = createSnapshot()
  const baseAgreement = {
    ...agreementRefs,
    project: projectId,
    snapshot,
  }

  try {
    await Agreement.init()
    await Agreement.create({
      ...baseAgreement,
      version: 1,
      status: 'draft',
      draftFingerprint: 'a'.repeat(64),
    })
    await assert.rejects(
      Agreement.create({ ...baseAgreement, version: 1, status: 'draft' }),
      (error) => error?.code === 11000,
    )
    await assert.rejects(
      Agreement.create({
        ...baseAgreement,
        version: 2,
        status: 'draft',
        draftFingerprint: 'a'.repeat(64),
      }),
      (error) => error?.code === 11000,
    )
    await Agreement.create({ ...baseAgreement, version: 3, status: 'pending_provider_acceptance' })
    await assert.rejects(
      Agreement.create({ ...baseAgreement, version: 4, status: 'pending_provider_acceptance' }),
      (error) => error?.code === 11000,
    )
  } finally {
    await Agreement.deleteMany({ project: projectId })
    await mongoose.disconnect()
  }
})
