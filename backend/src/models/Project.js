import mongoose from 'mongoose'

const categories = [
  'Web Development',
  'Mobile App Development',
  'AI / Machine Learning',
  'UI / UX Design',
  'Data Analytics',
  'Blockchain / Web3',
  'Other',
]

const timelines = ['1–2 weeks', '3–4 weeks', '1–2 months', '3+ months']

const negotiationMilestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  percentage: {
    type: Number,
  },
}, {
  _id: false,
})

const negotiationSchema = new mongoose.Schema({
  price: Number,
  timeline: String,
  deliverables: [String],
  milestones: [negotiationMilestoneSchema],
  updatedAt: Date,
}, {
  _id: false,
})

const agreementPreviewSchema = new mongoose.Schema({
  previewReference: {
    type: String,
    trim: true,
  },
  previewedAt: Date,
  status: {
    type: String,
    enum: ['PREVIEW_ONLY'],
  },
}, {
  _id: false,
})

const projectSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  idempotencyKey: {
    type: String,
    select: false,
  },
  idempotencyFingerprint: {
    type: String,
    select: false,
  },
  title: {
    type: String,
    required: [true, 'Project title is required.'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Project description is required.'],
    trim: true,
    minlength: [30, 'Project description must be at least 30 characters.'],
  },
  category: {
    type: String,
    required: [true, 'Project category is required.'],
    enum: {
      values: categories,
      message: 'Select a valid project category.',
    },
    trim: true,
  },
  budget: {
    type: Number,
    required: [true, 'Estimated budget is required.'],
    min: [1000, 'Budget must be at least 1000.'],
    max: [10000000, 'Budget must not exceed 10000000.'],
    validate: {
      validator: Number.isInteger,
      message: 'Budget must be a whole number.',
    },
  },
  timeline: {
    type: String,
    required: [true, 'Desired timeline is required.'],
    enum: {
      values: timelines,
      message: 'Select a valid desired timeline.',
    },
    trim: true,
  },
  skills: {
    type: [{
      type: String,
      trim: true,
      required: true,
    }],
    required: [true, 'Add at least one required skill.'],
    validate: [
      {
        validator: (skills) => skills.length > 0,
        message: 'Add at least one required skill.',
      },
      {
        validator: (skills) => skills.every((skill) => skill.length > 0),
        message: 'Skills must not be empty.',
      },
    ],
  },
  selectedProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: undefined,
  },
  negotiation: {
    type: negotiationSchema,
    default: undefined,
  },
  agreementPreview: {
    type: agreementPreviewSchema,
    default: undefined,
  },
}, {
  timestamps: true,
  versionKey: false,
})

projectSchema.index(
  { owner: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'unique_project_idempotency_per_owner',
  },
)

const Project = mongoose.model('Project', projectSchema)

export { categories, timelines }
export default Project
