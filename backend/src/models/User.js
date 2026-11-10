import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required.'],
    select: false,
  },
  role: {
    type: String,
    enum: ['client'],
    default: 'client',
  },
}, {
  timestamps: true,
  versionKey: false,
})

const User = mongoose.model('User', userSchema)

export default User
