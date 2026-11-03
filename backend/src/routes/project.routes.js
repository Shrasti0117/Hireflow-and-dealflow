import { Router } from 'express'
import {
  createProject,
  createOrGetAgreementPreview,
  getProjectById,
  getProjects,
  updateProjectNegotiation,
  updateSelectedProvider,
} from '../controllers/project.controller.js'

const router = Router()

// These project endpoints are currently public; authentication and authorization are not implemented.
router.post('/', createProject)
router.get('/', getProjects)
router.patch('/:id/provider', updateSelectedProvider)
router.patch('/:id/negotiation', updateProjectNegotiation)
router.patch('/:id/agreement-preview', createOrGetAgreementPreview)
router.get('/:id', getProjectById)

export default router
