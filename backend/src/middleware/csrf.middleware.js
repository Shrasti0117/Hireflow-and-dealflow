import { createHmac, timingSafeEqual } from 'node:crypto'

const csrfCookieName = 'dealflow_csrf'
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

function getAllowedOrigin() {
  return process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
}

function sendForbidden(response, message) {
  return response.status(403).json({
    success: false,
    error: message,
  })
}

function validateOrigin(request, response, next) {
  if (safeMethods.has(request.method)) return next()

  if (request.get('origin') !== getAllowedOrigin()) {
    return sendForbidden(response, 'Request origin is not allowed.')
  }

  return next()
}

function createCsrfToken(request) {
  return createHmac('sha256', process.env.JWT_SECRET.trim())
    .update(`dealflow-csrf:${request.cookies.dealflow_token}`)
    .digest('hex')
}

function requireCsrf(request, response, next) {
  if (safeMethods.has(request.method)) return next()

  if (request.get('origin') !== getAllowedOrigin()) {
    return sendForbidden(response, 'Request origin is not allowed.')
  }

  const cookieToken = request.cookies?.[csrfCookieName]
  const headerToken = request.get('x-csrf-token')
  if (
    typeof cookieToken !== 'string'
    || typeof headerToken !== 'string'
    || !/^[\da-f]{64}$/.test(cookieToken)
    || !/^[\da-f]{64}$/.test(headerToken)
  ) {
    return sendForbidden(response, 'CSRF validation failed.')
  }

  const cookieBuffer = Buffer.from(cookieToken, 'hex')
  const headerBuffer = Buffer.from(headerToken, 'hex')
  const expectedBuffer = Buffer.from(createCsrfToken(request), 'hex')
  if (
    !timingSafeEqual(cookieBuffer, headerBuffer)
    || !timingSafeEqual(cookieBuffer, expectedBuffer)
  ) {
    return sendForbidden(response, 'CSRF validation failed.')
  }

  return next()
}

function requireLogoutCsrf(request, response, next) {
  if (safeMethods.has(request.method)) return next()

  if (request.get('origin') !== getAllowedOrigin()) {
    return sendForbidden(response, 'Request origin is not allowed.')
  }

  const hasSessionCookie = typeof request.cookies?.dealflow_token === 'string'
  const hasCsrfCookie = typeof request.cookies?.[csrfCookieName] === 'string'
  if (!hasSessionCookie && !hasCsrfCookie) return next()

  return requireCsrf(request, response, next)
}

export { createCsrfToken, requireCsrf, requireLogoutCsrf, validateOrigin }
