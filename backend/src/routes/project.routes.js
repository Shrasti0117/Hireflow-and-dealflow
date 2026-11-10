import { Router } from 'express'
import {
  createProject,
  createOrGetAgreementPreview,
  getProjectById,
  getProjects,
  updateProjectNegotiation,
  updateSelectedProvider,
} from '../controllers/project.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { requireCsrf } from '../middleware/csrf.middleware.js'

const router = Router()

router.use(protect, requireCsrf)

router.post('/', createProject)
router.get('/', getProjects)
router.patch('/:id/provider', updateSelectedProvider)
router.patch('/:id/negotiation', updateProjectNegotiation)
router.patch('/:id/agreement-preview', createOrGetAgreementPreview)
router.get('/:id', getProjectById)

export default router
