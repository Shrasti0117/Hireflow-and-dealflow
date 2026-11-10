import { Router } from 'express'
import {
  createAgreementDraft,
  getAgreementById,
} from '../controllers/agreement.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { requireCsrf } from '../middleware/csrf.middleware.js'

const router = Router()

router.post('/projects/:projectId/agreements', protect, requireCsrf, createAgreementDraft)
router.get('/agreements/:agreementId', protect, getAgreementById)

export default router
