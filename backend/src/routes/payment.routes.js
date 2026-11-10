import { Router } from 'express'
import {
  getPaymentStatus,
  createRazorpayOrderForAgreement,
  razorpayVerifyPayment,
} from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { requireCsrf } from '../middleware/csrf.middleware.js'

const router = Router()

router.post('/agreements/:agreementId/payments/razorpay/order', protect, requireCsrf, createRazorpayOrderForAgreement)
router.post('/payments/:paymentId/razorpay/verify', protect, requireCsrf, razorpayVerifyPayment)
router.get('/payments/:paymentId', protect, getPaymentStatus)

export default router
