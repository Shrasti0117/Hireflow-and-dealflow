import mongoose from 'mongoose'

const paymentStatuses = [
  'creating_order',
  'order_created',
  'verification_pending',
  'completed',
  'failed',
  'unknown',
]

const paymentSchema = new mongoose.Schema({
  agreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
    required: true,
    immutable: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    immutable: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  },
  mode: {
    type: String,
    enum: ['razorpay_test_demo'],
    required: true,
    immutable: true,
  },
  status: {
    type: String,
    enum: paymentStatuses,
    required: true,
    default: 'creating_order',
  },
  amountMinor: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
    immutable: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR'],
    immutable: true,
  },
  agreementVersion: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isInteger,
    immutable: true,
  },
  snapshotHash: {
    type: String,
    required: true,
    match: /^[\da-f]{64}$/,
    immutable: true,
  },
  razorpayOrderId: {
    type: String,
    default: undefined,
  },
  razorpayPaymentId: {
    type: String,
    default: undefined,
  },
  razorpayReceipt: {
    type: String,
    required: true,
    immutable: true,
    maxlength: 40,
  },
  signatureVerifiedAt: {
    type: Date,
    default: undefined,
  },
  capturedAt: {
    type: Date,
    default: undefined,
  },
  orderLeaseUntil: {
    type: Date,
    default: undefined,
  },
  lastErrorCode: {
    type: String,
    match: /^[a-z\d_]{1,64}$/i,
    default: undefined,
  },
}, {
  timestamps: true,
  versionKey: false,
})

paymentSchema.index({ agreement: 1 }, { unique: true, name: 'unique_payment_per_agreement' })
paymentSchema.index(
  { razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayOrderId: { $type: 'string' } },
    name: 'unique_payment_razorpay_order',
  },
)
paymentSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayPaymentId: { $type: 'string' } },
    name: 'unique_payment_razorpay_payment',
  },
)
paymentSchema.index(
  { razorpayReceipt: 1 },
  { unique: true, name: 'unique_payment_razorpay_receipt' },
)
paymentSchema.index({ client: 1, createdAt: -1 }, { name: 'payment_client_created' })

const Payment = mongoose.model('Payment', paymentSchema)

export { paymentStatuses }
export default Payment
