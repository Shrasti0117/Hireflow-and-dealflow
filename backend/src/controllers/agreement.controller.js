import { createHash } from 'node:crypto'
import mongoose from 'mongoose'
import Agreement, { createAgreementSnapshot } from '../models/Agreement.js'
import Project from '../models/Project.js'
import Provider from '../models/Provider.js'

const maximumVersionRetries = 3
const transactionTopologyTypes = new Set([
  'ReplicaSetWithPrimary',
  'Sharded',
  'LoadBalanced',
])

function sendError(response, status, error) {
  return response.status(status).json({
    success: false,
    error,
  })
}

function isTransactionUnsupported(error) {
  return [20, 303, 40573].includes(error?.code)
    || /Transaction numbers are only allowed|transactions are not supported|replica set|mongos/i.test(error?.message ?? '')
}

function isVersionDuplicate(error) {
  return error?.code === 11000
    && (
      (error.keyPattern?.project === 1 && error.keyPattern?.version === 1)
      || error.message?.includes('unique_agreement_version_per_project')
    )
}

function isDraftFingerprintDuplicate(error) {
  return error?.code === 11000
    && (
      error.message?.includes('unique_draft_agreement_per_project_fingerprint')
      || (error.keyPattern?.project === 1 && error.keyPattern?.draftFingerprint === 1)
    )
}

function isTransientTransaction(error) {
  return error?.hasErrorLabel?.('TransientTransactionError') === true
}

function getDraftFingerprint(providerId, snapshotHash) {
  return createHash('sha256')
    .update(`${providerId.toString()}:${snapshotHash}`)
    .digest('hex')
}

function getAgreementResponse(agreement) {
  const data = agreement.toObject()
  return {
    _id: data._id,
    project: data.project,
    client: data.client,
    provider: data.provider,
    providerUser: data.providerUser,
    version: data.version,
    supersedesAgreement: data.supersedesAgreement,
    status: data.status,
    expiresAt: data.expiresAt,
    closedReason: data.closedReason,
    snapshot: data.snapshot,
    acceptances: data.acceptances,
    rejectedBy: data.rejectedBy,
    rejectedAt: data.rejectedAt,
    rejectionReason: data.rejectionReason,
    cancelledBy: data.cancelledBy,
    cancelledAt: data.cancelledAt,
    cancellationReason: data.cancellationReason,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function percentageToBasisPoints(percentage) {
  if (typeof percentage !== 'number' || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new TypeError('Milestone percentages must be finite numbers from 0 to 100.')
  }

  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(percentage.toString())
  if (!match) throw new TypeError('Milestone percentage must be representable in whole basis points.')

  const fraction = match[2] ?? ''
  const exponent = Number(match[3] ?? 0)
  const digits = BigInt(`${match[1]}${fraction}`)
  const basisPointScale = 2 + exponent - fraction.length
  let basisPoints

  if (basisPointScale >= 0) {
    basisPoints = digits * (10n ** BigInt(basisPointScale))
  } else {
    const divisorPower = -basisPointScale
    if (divisorPower > `${digits}`.length) {
      throw new TypeError('Milestone percentages must not have more than two meaningful decimal places.')
    }

    const divisor = 10n ** BigInt(divisorPower)
    if (digits % divisor !== 0n) {
      throw new TypeError('Milestone percentages must not have more than two meaningful decimal places.')
    }
    basisPoints = digits / divisor
  }

  if (basisPoints < 0n || basisPoints > 10000n) {
    throw new TypeError('Milestone percentages must be finite numbers from 0 to 100.')
  }

  return Number(basisPoints)
}

function convertMilestonePercentagesToBasisPoints(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new TypeError('At least one milestone is required.')
  }

  const converted = milestones.map((milestone) => {
    if (!milestone || typeof milestone !== 'object') {
      throw new TypeError('Each milestone must be an object.')
    }

    return {
      name: milestone.name,
      description: milestone.description,
      percentageBps: percentageToBasisPoints(milestone.percentage),
    }
  })

  if (converted.reduce((total, milestone) => total + milestone.percentageBps, 0) !== 10000) {
    throw new TypeError('Milestone percentages must total exactly 100%.')
  }

  return converted
}

function buildSnapshot(project, provider) {
  const negotiation = project.negotiation
  if (!negotiation) {
    const error = new Error('Save negotiation terms before creating an agreement draft.')
    error.status = 409
    throw error
  }

  if (project.selectedProviderId == null) {
    const error = new Error('Select a provider before creating an agreement draft.')
    error.status = 409
    throw error
  }

  if (!provider) {
    const error = new Error('The selected provider is no longer available.')
    error.status = 404
    throw error
  }

  try {
    const milestones = convertMilestonePercentagesToBasisPoints(negotiation.milestones)
    return createAgreementSnapshot({
      price: negotiation.price,
      timeline: negotiation.timeline,
      deliverables: negotiation.deliverables,
      milestones,
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
  } catch (error) {
    if (error instanceof TypeError) {
      error.status = 422
      error.message = 'Saved negotiation terms cannot be used to create an agreement draft.'
    }
    throw error
  }
}

function transactionSupportAvailable() {
  const topologyType = mongoose.connection.getClient()?.topology?.description?.type
  return transactionTopologyTypes.has(topologyType)
}

async function createAgreementDraft(request, response, next) {
  const { projectId } = request.params
  if (!/^[\da-f]{24}$/i.test(projectId)) {
    return sendError(response, 400, 'Invalid project ID.')
  }

  if (!transactionSupportAvailable()) {
    return sendError(response, 503, 'Agreement drafts require a MongoDB replica set or sharded deployment with transaction support.')
  }

  const projectObjectId = new mongoose.Types.ObjectId(projectId)
  const clientObjectId = new mongoose.Types.ObjectId(request.user.id)

  try {
    await Agreement.init()

    for (let attempt = 0; attempt < maximumVersionRetries; attempt += 1) {
      const session = await mongoose.startSession()
      let createdAgreement
      let draftFingerprint
      let draftProviderId
      let draftSnapshotHash
      let draftFingerprintConflict = false
      let reusedDraft = false

      try {
        await session.withTransaction(async () => {
          const project = await Project.findOne({
            _id: projectObjectId,
            owner: clientObjectId,
          }).session(session)

          if (!project) {
            const error = new Error('Project not found.')
            error.status = 404
            throw error
          }

          if (project.selectedProviderId == null) {
            const error = new Error('Select a provider before creating an agreement draft.')
            error.status = 409
            throw error
          }

          if (!project.negotiation) {
            const error = new Error('Save negotiation terms before creating an agreement draft.')
            error.status = 409
            throw error
          }

          const provider = await Provider.findById(project.selectedProviderId).session(session)
          const snapshot = buildSnapshot(project, provider)
          draftProviderId = project.selectedProviderId
          draftSnapshotHash = snapshot.hash
          draftFingerprint = getDraftFingerprint(project.selectedProviderId, snapshot.hash)

          createdAgreement = await Agreement.findOne({
            project: project._id,
            client: clientObjectId,
            provider: project.selectedProviderId,
            status: 'draft',
            'snapshot.hash': snapshot.hash,
          })
            .sort({ version: -1 })
            .session(session)

          if (createdAgreement) {
            reusedDraft = true
            return
          }

          const latestAgreement = await Agreement.findOne({
            project: project._id,
          })
            .sort({ version: -1 })
            .select('version')
            .session(session)
          const version = (latestAgreement?.version ?? 0) + 1

          createdAgreement = await Agreement.create([{
            project: project._id,
            client: clientObjectId,
            provider: project.selectedProviderId,
            version,
            status: 'draft',
            draftFingerprint,
            snapshot,
          }], { session }).then(([agreement]) => agreement)
        })

        return response.status(reusedDraft ? 200 : 201).json({
          success: true,
          data: getAgreementResponse(createdAgreement),
        })
      } catch (error) {
        if (error.status) return sendError(response, error.status, error.message)
        if (isTransactionUnsupported(error)) {
          return sendError(response, 503, 'Agreement drafts require a MongoDB replica set or sharded deployment with transaction support.')
        }
        if (isDraftFingerprintDuplicate(error)) {
          draftFingerprintConflict = true
        } else if (
          (isVersionDuplicate(error) || isTransientTransaction(error))
          && attempt < maximumVersionRetries - 1
        ) continue
        else if (isVersionDuplicate(error) || isTransientTransaction(error)) {
          return sendError(response, 409, 'Could not allocate an agreement version due to concurrent requests. Please retry.')
        } else {
          return next(error)
        }
      } finally {
        await session.endSession()
      }

      if (draftFingerprintConflict) {
        try {
          createdAgreement = await Agreement.findOne({
            project: projectObjectId,
            client: clientObjectId,
            provider: draftProviderId,
            status: 'draft',
            'snapshot.hash': draftSnapshotHash,
            draftFingerprint,
          }).sort({ version: -1 })
          if (createdAgreement) {
            return response.status(200).json({
              success: true,
              data: getAgreementResponse(createdAgreement),
            })
          }
        } catch (error) {
          return next(error)
        }

        if (attempt < maximumVersionRetries - 1) continue
        return sendError(response, 409, 'Could not safely resolve the concurrent Agreement draft request. Please retry.')
      }
    }

    return sendError(response, 409, 'Could not allocate an agreement version due to concurrent requests. Please retry.')
  } catch (error) {
    if (error.status) return sendError(response, error.status, error.message)
    if (isTransactionUnsupported(error)) {
      return sendError(response, 503, 'Agreement drafts require a MongoDB replica set or sharded deployment with transaction support.')
    }
    return next(error)
  }
}

async function getAgreementById(request, response, next) {
  const { agreementId } = request.params
  if (!/^[\da-f]{24}$/i.test(agreementId)) {
    return sendError(response, 400, 'Invalid agreement ID.')
  }

  try {
    const agreement = await Agreement.findById(new mongoose.Types.ObjectId(agreementId))
    if (!agreement) return sendError(response, 404, 'Agreement not found.')

    const requesterId = request.user.id
    const currentProjectOwnership = await Project.exists({
      _id: agreement.project,
      owner: new mongoose.Types.ObjectId(requesterId),
    })
    const isClient = Boolean(currentProjectOwnership)
    const isLinkedProvider = agreement.providerUser
      && agreement.providerUser.toString() === requesterId

    if (!isClient && !isLinkedProvider) {
      return sendError(response, 404, 'Agreement not found.')
    }

    return response.json({
      success: true,
      data: getAgreementResponse(agreement),
    })
  } catch (error) {
    return next(error)
  }
}

export {
  convertMilestonePercentagesToBasisPoints,
  createAgreementDraft,
  getAgreementById,
  percentageToBasisPoints,
}
