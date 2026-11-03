import 'dotenv/config'
import mongoose from 'mongoose'
import demoProviders from '../../../frontend/src/data/demoProviders.js'
import { connectToDatabase } from '../config/db.js'
import Provider from '../models/Provider.js'

async function seedProviders() {
  const mongoUri = process.env.MONGODB_URI?.trim()
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Set it in backend/.env before seeding providers.')
  }

  await connectToDatabase(mongoUri)

  const existingCount = await Provider.countDocuments()
  if (existingCount > 0) {
    console.log(`Provider seed skipped: ${existingCount} provider record(s) already exist.`)
    return
  }

  const seedRecords = demoProviders.map(({
    id,
    ...provider
  }) => ({
    ...provider,
    isDemo: true,
  }))

  const providers = await Provider.insertMany(seedRecords)
  console.log(`Inserted ${providers.length} fictional demo provider record(s).`)
}

try {
  await seedProviders()
} catch (error) {
  console.error(`Provider seed failed (${error.name || 'error'}). Check MongoDB configuration and database availability.`)
  process.exitCode = 1
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
