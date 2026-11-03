import mongoose from 'mongoose'

async function connectToDatabase(uri) {
  await mongoose.connect(uri)
  console.log('MongoDB connected.')
}

export { connectToDatabase }
