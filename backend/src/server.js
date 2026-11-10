import 'dotenv/config'
import app from './app.js'
import { connectToDatabase } from './config/db.js'

function getConfig() {
  const mongoUri = process.env.MONGODB_URI?.trim()
  const jwtSecret = process.env.JWT_SECRET?.trim()

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Set it in backend/.env before starting the server.')
  }

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required. Set it in backend/.env before starting the server.')
  }

  let parsedMongoUri
  try {
    parsedMongoUri = new URL(mongoUri)
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.')
  }

  if (
    !['mongodb:', 'mongodb+srv:'].includes(parsedMongoUri.protocol)
    || !parsedMongoUri.hostname
  ) {
    throw new Error('MONGODB_URI must use the mongodb:// or mongodb+srv:// scheme and include a host.')
  }

  const port = Number(process.env.PORT || 5000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }

  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  let parsedFrontendOrigin
  try {
    parsedFrontendOrigin = new URL(frontendOrigin)
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid origin URL.')
  }

  if (!['http:', 'https:'].includes(parsedFrontendOrigin.protocol) || parsedFrontendOrigin.origin !== frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN must contain only an http or https origin, without a path.')
  }

  return { mongoUri, port }
}

async function startServer() {
  const { mongoUri, port } = getConfig()

  try {
    await connectToDatabase(mongoUri)
  } catch (error) {
    console.error(`MongoDB connection failed (${error.name || 'connection error'}). Check MONGODB_URI and database network access.`)
    process.exitCode = 1
    return
  }

  app.listen(port, () => {
    console.log(`DealFlow API listening on port ${port}.`)
  })
}

try {
  await startServer()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
