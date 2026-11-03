import mongoose from 'mongoose'

const providerSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: [true, 'Provider display name is required.'],
    trim: true,
  },
  initials: {
    type: String,
    required: [true, 'Provider initials are required.'],
    trim: true,
  },
  specialty: {
    type: String,
    required: [true, 'Provider specialty is required.'],
    trim: true,
  },
  skills: {
    type: [{
      type: String,
      trim: true,
      required: true,
    }],
    required: [true, 'Provider skills are required.'],
    validate: [
      {
        validator: (skills) => skills.length > 0,
        message: 'Add at least one provider skill.',
      },
      {
        validator: (skills) => skills.every((skill) => skill.length > 0),
        message: 'Provider skills must not be empty.',
      },
    ],
  },
  experienceYears: {
    type: Number,
    required: [true, 'Provider experience is required.'],
    min: [0, 'Provider experience cannot be negative.'],
  },
  proposedBudget: {
    type: Number,
    required: [true, 'Provider proposed budget is required.'],
    min: [Number.MIN_VALUE, 'Provider proposed budget must be positive.'],
  },
  delivery: {
    type: String,
    required: [true, 'Provider delivery estimate is required.'],
    trim: true,
  },
  deliveryMaxWeeks: {
    type: Number,
    required: [true, 'Provider maximum delivery weeks are required.'],
    min: [Number.MIN_VALUE, 'Provider maximum delivery weeks must be positive.'],
  },
  portfolio: {
    type: String,
    required: [true, 'Provider portfolio is required.'],
    trim: true,
  },
  profileStatus: {
    type: String,
    required: [true, 'Provider profile status is required.'],
    trim: true,
  },
  isDemo: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false,
})

const Provider = mongoose.model('Provider', providerSchema)

export default Provider
