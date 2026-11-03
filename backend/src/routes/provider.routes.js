import { Router } from 'express'
import {
  getProviderById,
  getProviders,
} from '../controllers/provider.controller.js'

const router = Router()

// These provider endpoints are currently public; authentication and authorization are not implemented.
router.get('/', getProviders)
router.get('/:id', getProviderById)

export default router
