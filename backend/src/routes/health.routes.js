import { Router } from 'express'

const router = Router()

router.get('/', (request, response) => {
  response.json({
    status: 'ok',
    message: 'DealFlow API is running.',
  })
})

export default router
