import { Router } from 'express'
import {
  getCsrfToken,
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js'
import { loginRateLimiter, registrationRateLimiter } from '../middleware/authRateLimit.middleware.js'
import { protect } from '../middleware/auth.middleware.js'
import { requireCsrf, requireLogoutCsrf, validateOrigin } from '../middleware/csrf.middleware.js'

const router = Router()

router.post('/register', validateOrigin, registrationRateLimiter, register)
router.post('/login', validateOrigin, loginRateLimiter, login)
router.get('/csrf', protect, getCsrfToken)
router.post('/logout', requireLogoutCsrf, logout)
router.get('/me', protect, getCurrentUser)

export default router
