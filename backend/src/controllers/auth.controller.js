import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createCsrfToken } from '../middleware/csrf.middleware.js'
import User from '../models/User.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistrationPayload(body) {
  const errors = {}
  const payload = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object.' }, payload }
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    errors.name = 'Name is required and must be a non-empty string.'
  } else {
    payload.name = body.name.trim()
  }

  if (typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required and must be a valid email address.'
  } else {
    const email = body.email.trim().toLowerCase()
    if (email.length > 254 || !emailPattern.test(email)) {
      errors.email = 'Email must be a valid email address.'
    } else {
      payload.email = email
    }
  }

  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.'
  } else {
    payload.password = body.password
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

function validateLoginPayload(body) {
  const errors = {}
  const payload = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object.' }, payload }
  }

  if (typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required and must be a valid email address.'
  } else {
    const email = body.email.trim().toLowerCase()
    if (email.length > 254 || !emailPattern.test(email)) {
      errors.email = 'Email must be a valid email address.'
    } else {
      payload.email = email
    }
  }

  if (typeof body.password !== 'string' || !body.password) {
    errors.password = 'Password is required.'
  } else {
    payload.password = body.password
  }

  return { errors, payload }
}

function getSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function register(request, response, next) {
  const { errors, payload } = validateRegistrationPayload(request.body)
  if (Object.keys(errors).length > 0) return sendValidationError(response, errors)

  try {
    const passwordHash = await argon2.hash(payload.password, {
      type: argon2.argon2id,
    })
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
    })

    return response.status(201).json({
      success: true,
      data: getSafeUser(user),
    })
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
      return response.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      })
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return sendValidationError(response, {
        registration: 'Registration details are invalid.',
      })
    }

    return next(error)
  }
}

async function login(request, response, next) {
  const { errors, payload } = validateLoginPayload(request.body)
  if (Object.keys(errors).length > 0) return sendValidationError(response, errors)

  try {
    const user = await User.findOne({ email: payload.email }).select('+passwordHash')
    if (!user || !(await argon2.verify(user.passwordHash, payload.password))) {
      return response.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      })
    }

    const token = jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET.trim(),
      {
        algorithm: 'HS256',
        subject: user.id,
        expiresIn: '1h',
      },
    )

    response.cookie('dealflow_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 1000,
    })

    return response.status(200).json({
      success: true,
      data: getSafeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

function getCurrentUser(request, response) {
  const { id, name, email, role } = request.user

  return response.status(200).json({
    success: true,
    data: { id, name, email, role },
  })
}

function getCsrfToken(request, response) {
  const csrfToken = createCsrfToken(request)
  response.cookie('dealflow_csrf', csrfToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 1000,
  })

  return response.status(200).json({
    success: true,
    data: { csrfToken },
  })
}

function logout(request, response) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
  response.clearCookie('dealflow_token', cookieOptions)
  response.clearCookie('dealflow_csrf', cookieOptions)

  return response.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}

export { getCsrfToken, getCurrentUser, login, logout, register }
