import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'

function sendUnauthorized(response) {
  return response.status(401).json({
    success: false,
    error: 'Authentication required.',
  })
}

async function protect(request, response, next) {
  const token = request.cookies?.dealflow_token
  if (!token || typeof token !== 'string') return sendUnauthorized(response)

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET?.trim(), {
      algorithms: ['HS256'],
    })
  } catch {
    return sendUnauthorized(response)
  }

  if (
    !payload
    || typeof payload !== 'object'
    || Array.isArray(payload)
    || typeof payload.sub !== 'string'
    || !/^[\da-f]{24}$/i.test(payload.sub)
  ) {
    return sendUnauthorized(response)
  }

  try {
    const user = await User.findById(new mongoose.Types.ObjectId(payload.sub))
    if (!user) return sendUnauthorized(response)

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

function authorizeRoles(...roles) {
  return (request, response, next) => {
    if (!request.user) return sendUnauthorized(response)

    if (!roles.includes(request.user.role)) {
      return response.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource.',
      })
    }

    return next()
  }
}

export { authorizeRoles, protect }
