import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import Project, { categories, timelines } from '../models/Project.js'
import Provider from '../models/Provider.js'

const projectFields = ['title', 'description', 'category', 'budget', 'timeline', 'skills']

function validateProjectPayload(body) {
  const errors = {}
  const payload = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object.' }, payload }
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    errors.title = 'Project title is required and must be a string.'
  } else {
    payload.title = body.title.trim()
  }

  if (typeof body.description !== 'string' || body.description.trim().length < 30) {
    errors.description = 'Project description must be a string with at least 30 non-whitespace characters.'
  } else {
    payload.description = body.description.trim()
  }

  if (typeof body.category !== 'string' || !categories.includes(body.category.trim())) {
    errors.category = 'Select a valid project category.'
  } else {
    payload.category = body.category.trim()
  }

  const budget = typeof body.budget === 'number'
    ? body.budget
    : typeof body.budget === 'string' && body.budget.trim()
      ? Number(body.budget)
      : Number.NaN
  if (!Number.isFinite(budget) || !Number.isInteger(budget) || budget < 1000 || budget > 10000000) {
    errors.budget = 'Budget must be a whole number from 1000 to 10000000.'
  } else {
    payload.budget = budget
  }

  if (typeof body.timeline !== 'string' || !timelines.includes(body.timeline.trim())) {
    errors.timeline = 'Select a valid desired timeline.'
  } else {
    payload.timeline = body.timeline.trim()
  }

  if (
    !Array.isArray(body.skills)
    || body.skills.length === 0
    || body.skills.some((skill) => typeof skill !== 'string' || !skill.trim())
  ) {
    errors.skills = 'Skills must be an array containing at least one non-empty string.'
  } else {
    payload.skills = body.skills.map((skill) => skill.trim())
  }

  return { errors, payload }
}

function sendValidationError(response, details) {
  return response.status(400).json({
    success: false,
    error: 'Validation failed.',
    details,
  })
}

function validateNegotiationPayload(body) {
  const errors = {}
  const payload = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object.' }, payload }
  }

  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0) {
    errors.price = 'Price must be a positive finite number.'
  } else {
    payload.price = body.price
  }

  if (typeof body.timeline !== 'string' || !body.timeline.trim()) {
    errors.timeline = 'Timeline is required and must be a non-empty string.'
  } else {
    payload.timeline = body.timeline.trim()
  }

  if (
    !Array.isArray(body.deliverables)
    || body.deliverables.length === 0
    || body.deliverables.some((deliverable) => typeof deliverable !== 'string' || !deliverable.trim())
  ) {
    errors.deliverables = 'Add at least one non-empty deliverable.'
  } else {
    payload.deliverables = body.deliverables.map((deliverable) => deliverable.trim())
  }

  if (!Array.isArray(body.milestones) || body.milestones.length === 0) {
    errors.milestones = 'Add at least one milestone.'
  } else {
    let percentageTotal = 0
    payload.milestones = body.milestones.map((milestone, index) => {
      if (!milestone || typeof milestone !== 'object' || Array.isArray(milestone)) {
        errors[`milestones.${index}`] = 'Each milestone must be an object.'
        return null
      }

      const validatedMilestone = {}
      if (typeof milestone.name !== 'string' || !milestone.name.trim()) {
        errors[`milestones.${index}.name`] = 'Milestone name is required.'
      } else {
        validatedMilestone.name = milestone.name.trim()
      }

      if (typeof milestone.description !== 'string' || !milestone.description.trim()) {
        errors[`milestones.${index}.description`] = 'Milestone description is required.'
      } else {
        validatedMilestone.description = milestone.description.trim()
      }

      if (
        typeof milestone.percentage !== 'number'
        || !Number.isFinite(milestone.percentage)
        || milestone.percentage < 0
        || milestone.percentage > 100
      ) {
        errors[`milestones.${index}.percentage`] = 'Milestone percentage must be a finite number from 0 to 100.'
      } else {
        validatedMilestone.percentage = milestone.percentage
        percentageTotal += milestone.percentage
      }

      return validatedMilestone
    })

    if (Math.abs(percentageTotal - 100) > 0.0000001) {
      errors.milestoneTotal = 'Milestone percentages must total exactly 100%.'
    }
  }

  return { errors, payload }
}

async function createProject(request, response, next) {
  const { errors, payload } = validateProjectPayload(request.body)
  if (Object.keys(errors).length > 0) return sendValidationError(response, errors)

  try {
    const project = await Project.create(payload)
    return response.status(201).json({
      success: true,
      data: project,
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const details = Object.fromEntries(
        Object.entries(error.errors ?? {}).map(([field, fieldError]) => [field, fieldError.message]),
      )
      return sendValidationError(response, details)
    }

    return next(error)
  }
}

async function getProjects(request, response, next) {
  try {
    const projects = await Project.find().sort({ createdAt: -1, _id: -1 })
    return response.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    return next(error)
  }
}

async function getProjectById(request, response, next) {
  const { id } = request.params
  if (!/^[\da-f]{24}$/i.test(id)) {
    return response.status(400).json({
      success: false,
      error: 'Invalid project ID.',
    })
  }

  try {
    const project = await Project.findById(new mongoose.Types.ObjectId(id))
      .populate('selectedProviderId')
    if (!project) {
      return response.status(404).json({
        success: false,
        error: 'Project not found.',
      })
    }

    return response.json({
      success: true,
      data: project,
    })
  } catch (error) {
    return next(error)
  }
}

async function updateSelectedProvider(request, response, next) {
  const { id } = request.params
  const providerId = request.body?.providerId

  if (!/^[\da-f]{24}$/i.test(id)) {
    return response.status(400).json({
      success: false,
      error: 'Invalid project ID.',
    })
  }

  if (typeof providerId !== 'string' || !/^[\da-f]{24}$/i.test(providerId)) {
    return response.status(400).json({
      success: false,
      error: 'A valid providerId is required.',
    })
  }

  try {
    const project = await Project.findById(new mongoose.Types.ObjectId(id))
    if (!project) {
      return response.status(404).json({
        success: false,
        error: 'Project not found.',
      })
    }

    const provider = await Provider.findById(new mongoose.Types.ObjectId(providerId))
    if (!provider) {
      return response.status(404).json({
        success: false,
        error: 'Provider not found.',
      })
    }

    project.selectedProviderId = provider._id
    await project.save()
    await project.populate('selectedProviderId')

    return response.json({
      success: true,
      data: project,
    })
  } catch (error) {
    return next(error)
  }
}

async function updateProjectNegotiation(request, response, next) {
  const { id } = request.params
  if (!/^[\da-f]{24}$/i.test(id)) {
    return response.status(400).json({
      success: false,
      error: 'Invalid project ID.',
    })
  }

  const { errors, payload } = validateNegotiationPayload(request.body)
  if (Object.keys(errors).length > 0) return sendValidationError(response, errors)

  try {
    const project = await Project.findById(new mongoose.Types.ObjectId(id))
    if (!project) {
      return response.status(404).json({
        success: false,
        error: 'Project not found.',
      })
    }

    project.negotiation = {
      ...payload,
      updatedAt: new Date(),
    }
    await project.save()

    return response.json({
      success: true,
      data: project,
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const details = Object.fromEntries(
        Object.entries(error.errors ?? {}).map(([field, fieldError]) => [field, fieldError.message]),
      )
      return sendValidationError(response, details)
    }

    return next(error)
  }
}

async function createOrGetAgreementPreview(request, response, next) {
  const { id } = request.params
  if (!/^[\da-f]{24}$/i.test(id)) {
    return response.status(400).json({
      success: false,
      error: 'Invalid project ID.',
    })
  }

  try {
    const projectId = new mongoose.Types.ObjectId(id)
    const project = await Project.findById(projectId)
    if (!project) {
      return response.status(404).json({
        success: false,
        error: 'Project not found.',
      })
    }

    if (!project.agreementPreview?.previewReference) {
      const agreementPreview = {
        previewReference: `DF-PREVIEW-${randomUUID().slice(0, 8).toUpperCase()}`,
        previewedAt: new Date(),
        status: 'PREVIEW_ONLY',
      }

      await Project.updateOne({
        _id: projectId,
        $or: [
          { 'agreementPreview.previewReference': { $exists: false } },
          { 'agreementPreview.previewReference': null },
        ],
      }, {
        $set: { agreementPreview },
      })
    }

    const updatedProject = await Project.findById(projectId)
      .populate('selectedProviderId')
    if (!updatedProject) {
      return response.status(404).json({
        success: false,
        error: 'Project not found.',
      })
    }

    return response.json({
      success: true,
      data: updatedProject,
    })
  } catch (error) {
    return next(error)
  }
}

export {
  createProject,
  createOrGetAgreementPreview,
  getProjectById,
  getProjects,
  projectFields,
  updateProjectNegotiation,
  updateSelectedProvider,
}
