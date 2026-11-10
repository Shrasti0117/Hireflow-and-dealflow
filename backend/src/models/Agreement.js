import { createHash } from 'node:crypto'
import mongoose from 'mongoose'

const agreementStatuses = [
  'draft',
  'pending_provider_acceptance',
  'accepted',
  'rejected',
  'expired',
  'cancelled',
]
const maximumSafeInteger = Number.MAX_SAFE_INTEGER

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

function hashSnapshotData(snapshot) {
  const plainSnapshot = typeof snapshot.toObject === 'function' ? snapshot.toObject() : snapshot
  const { hash, ...snapshotData } = plainSnapshot
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(snapshotData)))
    .digest('hex')
}

function rupeesToPaise(rupees) {
  if (typeof rupees !== 'number' || !Number.isFinite(rupees) || rupees <= 0) {
    throw new TypeError('Price must be a positive finite number of rupees.')
  }

  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(rupees.toString())
  if (!match) throw new TypeError('Price must be representable in whole paise.')

  const fraction = match[2] ?? ''
  const exponent = Number(match[3] ?? 0)
  const digits = BigInt(`${match[1]}${fraction}`)
  const paiseScale = 2 + exponent - fraction.length
  let paise

  if (paiseScale >= 0) {
    paise = digits * (10n ** BigInt(paiseScale))
  } else {
    const divisor = 10n ** BigInt(-paiseScale)
    if (digits % divisor !== 0n) {
      throw new TypeError('Price must not include fractions of a paise.')
    }
    paise = digits / divisor
  }

  if (paise <= 0n || paise > BigInt(maximumSafeInteger)) {
    throw new TypeError('Price in paise must be a positive safe integer.')
  }

  return Number(paise)
}

function calculateMilestoneAmounts(totalAmountMinor, milestones) {
  let allocatedAmountMinor = 0

  // Floor every non-final share and assign all residual paise to the final milestone.
  return milestones.map((milestone, index) => {
    if (index === milestones.length - 1) {
      return totalAmountMinor - allocatedAmountMinor
    }

    const amountMinor = Number(
      (BigInt(totalAmountMinor) * BigInt(milestone.percentageBps)) / 10000n,
    )
    allocatedAmountMinor += amountMinor
    return amountMinor
  })
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.currency !== 'INR') return false
  if (!Number.isSafeInteger(snapshot.totalAmountMinor) || snapshot.totalAmountMinor <= 0) return false

  const terms = snapshot.terms
  if (
    !terms
    || !Number.isSafeInteger(terms.priceMinor)
    || terms.priceMinor <= 0
    || terms.priceMinor !== snapshot.totalAmountMinor
    || !isNonEmptyString(terms.timeline)
    || !Array.isArray(terms.deliverables)
    || terms.deliverables.length === 0
    || !terms.deliverables.every(isNonEmptyString)
    || !Array.isArray(terms.milestones)
    || terms.milestones.length === 0
    || !terms.milestones.every((milestone, index) => (
      Number.isInteger(milestone.position)
      && milestone.position === index
      && isNonEmptyString(milestone.name)
      && isNonEmptyString(milestone.description)
      && Number.isInteger(milestone.percentageBps)
      && milestone.percentageBps >= 1
      && milestone.percentageBps <= 10000
      && Number.isSafeInteger(milestone.amountMinor)
      && milestone.amountMinor >= 1
    ))
  ) {
    return false
  }

  if (terms.milestones.reduce((total, milestone) => total + milestone.percentageBps, 0) !== 10000) {
    return false
  }

  const expectedAmounts = calculateMilestoneAmounts(snapshot.totalAmountMinor, terms.milestones)
  if (!terms.milestones.every((milestone, index) => milestone.amountMinor === expectedAmounts[index])) {
    return false
  }

  if (terms.milestones.reduce((total, milestone) => total + milestone.amountMinor, 0) !== snapshot.totalAmountMinor) {
    return false
  }

  if (
    !terms.projectContext
    || !isNonEmptyString(terms.projectContext.title)
    || !isNonEmptyString(terms.projectContext.category)
    || !isNonEmptyString(terms.projectContext.description)
    || !terms.providerContext
    || !isNonEmptyString(terms.providerContext.displayName)
    || !isNonEmptyString(terms.providerContext.specialty)
    || !isNonEmptyString(terms.providerContext.profileStatus)
  ) {
    return false
  }

  return typeof snapshot.hash === 'string'
    && /^[\da-f]{64}$/.test(snapshot.hash)
    && snapshot.hash === hashSnapshotData(snapshot)
}

function createAgreementSnapshot({
  price,
  timeline,
  deliverables,
  milestones,
  projectContext,
  providerContext,
}) {
  if (!isNonEmptyString(timeline)) throw new TypeError('Timeline is required.')
  if (!Array.isArray(deliverables) || deliverables.length === 0 || !deliverables.every(isNonEmptyString)) {
    throw new TypeError('At least one non-empty deliverable is required.')
  }
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new TypeError('At least one milestone is required.')
  }
  if (!milestones.every((milestone) => (
    milestone
    && Number.isInteger(milestone.percentageBps)
    && milestone.percentageBps >= 1
    && milestone.percentageBps <= 10000
    && isNonEmptyString(milestone.name)
    && isNonEmptyString(milestone.description)
  ))) {
    throw new TypeError('Milestones require names, descriptions, and integer basis-point percentages from 1 to 10000.')
  }
  if (milestones.reduce((total, milestone) => total + milestone.percentageBps, 0) !== 10000) {
    throw new TypeError('Milestone percentages must total exactly 10000 basis points.')
  }
  if (
    !projectContext
    || !isNonEmptyString(projectContext.title)
    || !isNonEmptyString(projectContext.category)
    || !isNonEmptyString(projectContext.description)
    || !providerContext
    || !isNonEmptyString(providerContext.displayName)
    || !isNonEmptyString(providerContext.specialty)
    || !isNonEmptyString(providerContext.profileStatus)
  ) {
    throw new TypeError('Project and provider display context are required.')
  }

  const priceMinor = rupeesToPaise(price)
  const totalAmountMinor = priceMinor
  const snapshotMilestones = milestones.map((milestone, position) => ({
    position,
    name: milestone.name.trim(),
    description: milestone.description.trim(),
    percentageBps: milestone.percentageBps,
    amountMinor: 0,
  }))
  const amounts = calculateMilestoneAmounts(totalAmountMinor, snapshotMilestones)
  if (amounts.some((amountMinor) => !Number.isSafeInteger(amountMinor) || amountMinor <= 0)) {
    throw new TypeError('Every milestone must receive a positive safe-integer amount in paise.')
  }
  snapshotMilestones.forEach((milestone, index) => {
    milestone.amountMinor = amounts[index]
  })

  const snapshot = {
    currency: 'INR',
    totalAmountMinor,
    terms: {
      priceMinor,
      timeline: timeline.trim(),
      deliverables: deliverables.map((deliverable) => deliverable.trim()),
      milestones: snapshotMilestones,
      projectContext: {
        title: projectContext.title.trim(),
        category: projectContext.category.trim(),
        description: projectContext.description.trim(),
      },
      providerContext: {
        displayName: providerContext.displayName.trim(),
        specialty: providerContext.specialty.trim(),
        profileStatus: providerContext.profileStatus.trim(),
      },
    },
  }
  snapshot.hash = hashSnapshotData(snapshot)

  return snapshot
}

const milestoneSnapshotSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true,
    min: 0,
    validate: Number.isInteger,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  percentageBps: {
    type: Number,
    required: true,
    min: 1,
    max: 10000,
    validate: Number.isInteger,
  },
  amountMinor: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
  },
}, {
  _id: false,
})

const snapshotTermsSchema = new mongoose.Schema({
  priceMinor: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
  },
  timeline: {
    type: String,
    required: true,
    trim: true,
  },
  deliverables: {
    type: [{
      type: String,
      trim: true,
      required: true,
    }],
    required: true,
  },
  milestones: {
    type: [milestoneSnapshotSchema],
    required: true,
  },
  projectContext: {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  providerContext: {
    displayName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    profileStatus: { type: String, required: true, trim: true },
  },
}, {
  _id: false,
})

const snapshotSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    match: /^[\da-f]{64}$/,
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR'],
  },
  totalAmountMinor: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
  },
  terms: {
    type: snapshotTermsSchema,
    required: true,
  },
}, {
  _id: false,
})

const acceptanceEvidenceSchema = new mongoose.Schema({
  actorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  acceptedAt: {
    type: Date,
    required: true,
  },
  agreementVersion: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isInteger,
  },
  snapshotHash: {
    type: String,
    required: true,
    match: /^[\da-f]{64}$/,
  },
  acceptanceTextVersion: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  _id: false,
})

const agreementSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    immutable: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    immutable: true,
  },
  providerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
    immutable: true,
  },
  version: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isInteger,
    immutable: true,
  },
  draftFingerprint: {
    type: String,
    select: false,
    immutable: true,
  },
  supersedesAgreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
    default: undefined,
    immutable: true,
  },
  status: {
    type: String,
    enum: agreementStatuses,
    default: 'draft',
    required: true,
  },
  expiresAt: {
    type: Date,
    default: undefined,
  },
  closedReason: {
    type: String,
    trim: true,
    default: undefined,
  },
  // Mongoose immutability is defense in depth; lifecycle controllers still need strict update allowlists and conditional transitions.
  snapshot: {
    type: snapshotSchema,
    required: true,
    immutable: true,
  },
  acceptances: {
    client: {
      type: acceptanceEvidenceSchema,
      default: undefined,
    },
    provider: {
      type: acceptanceEvidenceSchema,
      default: undefined,
    },
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
  },
  rejectedAt: {
    type: Date,
    default: undefined,
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: undefined,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
  },
  cancelledAt: {
    type: Date,
    default: undefined,
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: undefined,
  },
}, {
  timestamps: true,
  versionKey: false,
})

agreementSchema.path('snapshot').validate(
  (snapshot) => snapshot && validateSnapshot(snapshot),
  'Agreement snapshot must have valid integer paise amounts and a matching canonical SHA-256 hash.',
)

agreementSchema.index(
  { project: 1, version: 1 },
  { unique: true, name: 'unique_agreement_version_per_project' },
)
agreementSchema.index({ project: 1, status: 1 }, { name: 'agreement_project_status' })
agreementSchema.index({ client: 1, createdAt: -1 }, { name: 'agreement_client_created' })
agreementSchema.index({ provider: 1, createdAt: -1 }, { name: 'agreement_provider_created' })
agreementSchema.index(
  { project: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending_provider_acceptance' },
    name: 'unique_pending_agreement_per_project',
  },
)
agreementSchema.index(
  { project: 1, draftFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'draft',
      draftFingerprint: { $type: 'string' },
    },
    name: 'unique_draft_agreement_per_project_fingerprint',
  },
)

const Agreement = mongoose.model('Agreement', agreementSchema)

export {
  agreementStatuses,
  calculateMilestoneAmounts,
  createAgreementSnapshot,
  hashSnapshotData,
  rupeesToPaise,
}
export default Agreement
