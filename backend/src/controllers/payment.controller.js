import mongoose from 'mongoose'
import Agreement from '../models/Agreement.js'
import Payment from '../models/Payment.js'
import Project from '../models/Project.js'
import Provider from '../models/Provider.js'
import {
  RazorpayServiceError,
  createRazorpayOrder,
  fetchRazorpayPayment,
  findRazorpayOrdersByReceipt,
  getRazorpayConfig,
  validateOrder,
  validateRazorpayPayment,
  verifyCheckoutSignature,
} from '../services/razorpay.service.js'

const orderLeaseMs = 120000
const receiptPrefix = 'df-'

function sendError(response, status, error) {
  return response.status(status).json({ success: false, error })
}

function getPaymentResponse(payment) {
  return {
    _id: String(payment._id),
    status: payment.status,
    mode: payment.mode,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    ...(payment.signatureVerifiedAt ? { signatureVerifiedAt: payment.signatureVerifiedAt } : {}),
    ...(payment.capturedAt ? { capturedAt: payment.capturedAt } : {}),
  }
}

function isDuplicateKey(error) {
  return error?.code === 11000
}

function getSafeErrorCode(error) {
  return /^[a-z\d_]{1,64}$/i.test(error?.code ?? '')
    ? error.code
    : 'razorpay_error'
}

function sendRazorpayError(response, error) {
  if (error instanceof RazorpayServiceError) {
    if (error.code === 'razorpay_not_configured') {
      return sendError(response, 503, 'Razorpay Test Mode credentials are not configured.')
    }
    if (error.code === 'razorpay_test_mode_only') {
      return sendError(response, 503, 'Razorpay payments are restricted to Test Mode.')
    }
    if (error.code === 'razorpay_configuration_incomplete') {
      return sendError(response, 503, 'Razorpay Test Mode configuration is incomplete.')
    }
  }
  return sendError(response, 502, 'Razorpay could not confirm the payment operation.')
}

function getCheckoutResponse(response, payment, config, status = 200) {
  return response.status(status).json({
    success: true,
    data: {
      paymentId: String(payment._id),
      keyId: config.keyId,
      orderId: payment.razorpayOrderId,
      amount: payment.amountMinor,
      currency: 'INR',
    },
  })
}

async function getOwnedDemoAgreement(agreementId, clientId) {
  const agreement = await Agreement.findById(agreementId)
  if (!agreement || String(agreement.client) !== clientId) return null

  const project = await Project.findOne({
    _id: agreement.project,
    owner: new mongoose.Types.ObjectId(clientId),
  }).select('selectedProviderId')
  if (!project || String(project.selectedProviderId) !== String(agreement.provider)) return null

  const provider = await Provider.findById(agreement.provider).select('isDemo')
  if (
    !provider
    || provider.isDemo !== true
    || agreement.status !== 'draft'
    || agreement.acceptances?.provider
  ) {
    return { ineligible: true }
  }
  return { agreement }
}

async function createPaymentReservation(agreement, clientId) {
  const paymentId = new mongoose.Types.ObjectId()
  return Payment.create({
    _id: paymentId,
    agreement: agreement._id,
    project: agreement.project,
    client: new mongoose.Types.ObjectId(clientId),
    mode: 'razorpay_test_demo',
    status: 'creating_order',
    amountMinor: agreement.snapshot.totalAmountMinor,
    currency: 'INR',
    agreementVersion: agreement.version,
    snapshotHash: agreement.snapshot.hash,
    razorpayReceipt: `${receiptPrefix}${paymentId.toString()}`,
  })
}

async function reconcileRazorpayOrder(payment) {
  const matches = (await findRazorpayOrdersByReceipt(payment.razorpayReceipt))
    .map((order) => validateOrder(order, payment))
  if (matches.length !== 1) {
    throw new RazorpayServiceError(
      matches.length === 0 ? 'razorpay_order_not_found_for_receipt' : 'razorpay_duplicate_receipt_orders',
      { uncertain: true },
    )
  }
  return matches[0]
}

async function saveRazorpayOrder(payment, order) {
  return Payment.findOneAndUpdate({
    _id: payment._id,
    client: payment.client,
    status: { $in: ['creating_order', 'unknown'] },
    $or: [
      { razorpayOrderId: { $exists: false } },
      { razorpayOrderId: null },
      { razorpayOrderId: order.id },
    ],
  }, {
    $set: {
      razorpayOrderId: order.id,
      status: 'order_created',
    },
    $unset: {
      orderLeaseUntil: 1,
      lastErrorCode: 1,
    },
  }, { new: true })
}

async function createRazorpayOrderForAgreement(request, response, next) {
  const { agreementId } = request.params
  if (!/^[\da-f]{24}$/i.test(agreementId)) return sendError(response, 400, 'Invalid agreement ID.')

  let config
  try {
    config = getRazorpayConfig()
  } catch (error) {
    return sendRazorpayError(response, error)
  }
  if (!config) return sendError(response, 503, 'Razorpay Test Mode credentials are not configured.')

  try {
    await Payment.init()
    const clientId = request.user.id
    const owned = await getOwnedDemoAgreement(new mongoose.Types.ObjectId(agreementId), clientId)
    if (!owned) return sendError(response, 404, 'Agreement not found.')
    if (owned.ineligible) return sendError(response, 409, 'Only unsigned demo agreements with fictional providers are eligible.')

    const { agreement } = owned
    const { snapshot } = agreement
    if (
      snapshot.currency !== 'INR'
      || !Number.isSafeInteger(snapshot.totalAmountMinor)
      || snapshot.totalAmountMinor <= 0
      || !/^[\da-f]{64}$/.test(snapshot.hash)
    ) {
      return sendError(response, 409, 'Agreement amount or currency is not eligible for Razorpay.')
    }

    let payment = await Payment.findOne({ agreement: agreement._id })
    if (!payment) {
      try {
        payment = await createPaymentReservation(agreement, clientId)
      } catch (error) {
        if (!isDuplicateKey(error)) throw error
        payment = await Payment.findOne({ agreement: agreement._id })
        if (!payment) throw error
      }
    } else if (
      String(payment.client) !== clientId
      || payment.snapshotHash !== snapshot.hash
      || payment.amountMinor !== snapshot.totalAmountMinor
      || payment.currency !== 'INR'
    ) {
      return sendError(response, 409, 'Payment record does not match the persisted agreement.')
    }

    if (payment.razorpayOrderId) return getCheckoutResponse(response, payment, config)

    const now = new Date()
    if (payment.status === 'creating_order' && payment.orderLeaseUntil && payment.orderLeaseUntil <= now) {
      await Payment.updateOne({
        _id: payment._id,
        status: 'creating_order',
        orderLeaseUntil: { $lte: now },
      }, {
        $set: { status: 'unknown', lastErrorCode: 'razorpay_order_attempt_interrupted' },
        $unset: { orderLeaseUntil: 1 },
      })
      payment = await Payment.findById(payment._id)
    }

    if (payment.status === 'unknown') {
      try {
        const order = await reconcileRazorpayOrder(payment)
        const reconciledPayment = await saveRazorpayOrder(payment, order)
        if (!reconciledPayment) return sendError(response, 409, 'Razorpay order reconciliation conflicted; retry safely.')
        return getCheckoutResponse(response, reconciledPayment, config)
      } catch (error) {
        await Payment.updateOne({ _id: payment._id, status: 'unknown' }, {
          $set: { lastErrorCode: getSafeErrorCode(error) },
        })
        return response.status(202).json({
          success: false,
          data: getPaymentResponse(payment),
          message: 'Order creation is uncertain. The existing receipt is being reconciled; no second order was created.',
        })
      }
    }

    if (payment.status === 'creating_order' && payment.orderLeaseUntil) {
      return response.status(202).json({
        success: false,
        data: getPaymentResponse(payment),
        message: 'Razorpay order creation is in progress.',
      })
    }

    const claimedPayment = await Payment.findOneAndUpdate({
      _id: payment._id,
      client: new mongoose.Types.ObjectId(clientId),
      status: { $in: ['creating_order', 'failed'] },
      $or: [
        { orderLeaseUntil: { $exists: false } },
        { orderLeaseUntil: null },
      ],
      $and: [{
        $or: [
          { razorpayOrderId: { $exists: false } },
          { razorpayOrderId: null },
        ],
      }],
    }, {
      $set: {
        status: 'creating_order',
        orderLeaseUntil: new Date(now.getTime() + orderLeaseMs),
      },
    }, { new: true })

    if (!claimedPayment) {
      const current = await Payment.findById(payment._id)
      if (current?.razorpayOrderId) return getCheckoutResponse(response, current, config)
      return response.status(202).json({
        success: false,
        data: current ? getPaymentResponse(current) : getPaymentResponse(payment),
        message: 'Razorpay order creation is in progress or requires reconciliation.',
      })
    }

    try {
      const order = await createRazorpayOrder(claimedPayment)
      const createdPayment = await saveRazorpayOrder(claimedPayment, order)
      if (!createdPayment) {
        return sendError(response, 409, 'Razorpay order state could not be safely reconciled.')
      }
      return getCheckoutResponse(response, createdPayment, config, 201)
    } catch (error) {
      const uncertain = error?.uncertain === true
      await Payment.updateOne({
        _id: claimedPayment._id,
        status: 'creating_order',
      }, {
        $set: {
          status: uncertain ? 'unknown' : 'failed',
          lastErrorCode: getSafeErrorCode(error),
        },
        $unset: { orderLeaseUntil: 1 },
      })
      return sendRazorpayError(response, error)
    }
  } catch (error) {
    return next(error)
  }
}

async function razorpayVerifyPayment(request, response, next) {
  const { paymentId } = request.params
  if (!/^[\da-f]{24}$/i.test(paymentId)) return sendError(response, 400, 'Invalid payment ID.')

  let config
  try {
    config = getRazorpayConfig()
  } catch (error) {
    return sendRazorpayError(response, error)
  }
  if (!config) return sendError(response, 503, 'Razorpay Test Mode credentials are not configured.')

  const body = request.body
  const razorpayPaymentId = body?.razorpay_payment_id
  const razorpayOrderId = body?.razorpay_order_id
  const razorpaySignature = body?.razorpay_signature
  if (
    !body
    || typeof body !== 'object'
    || Array.isArray(body)
    || typeof razorpayPaymentId !== 'string'
    || !/^pay_[A-Za-z0-9]+$/.test(razorpayPaymentId)
    || typeof razorpayOrderId !== 'string'
    || !/^order_[A-Za-z0-9]+$/.test(razorpayOrderId)
    || typeof razorpaySignature !== 'string'
    || !/^[\da-f]{64}$/i.test(razorpaySignature)
  ) {
    return sendError(response, 400, 'Valid Razorpay payment verification fields are required.')
  }

  try {
    const payment = await Payment.findOne({
      _id: new mongoose.Types.ObjectId(paymentId),
      client: new mongoose.Types.ObjectId(request.user.id),
    })
    if (!payment) return sendError(response, 404, 'Payment not found.')
    if (!payment.razorpayOrderId || payment.razorpayOrderId !== razorpayOrderId) {
      return sendError(response, 409, 'Razorpay order does not match this payment.')
    }
    if (!verifyCheckoutSignature(
      payment.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      { environment: process.env },
    )) {
      return sendError(response, 400, 'Razorpay payment signature is invalid.')
    }
    if (payment.status === 'completed') {
      if (payment.razorpayPaymentId !== razorpayPaymentId) {
        return sendError(response, 409, 'Razorpay payment does not match the completed transaction.')
      }
      return response.json({ success: true, data: getPaymentResponse(payment) })
    }
    if (!['order_created', 'verification_pending', 'unknown'].includes(payment.status)) {
      return sendError(response, 409, 'Payment is not in a verifiable state.')
    }

    const signatureVerifiedAt = payment.signatureVerifiedAt ?? new Date()
    await Payment.updateOne({
      _id: payment._id,
      client: payment.client,
      status: { $in: ['order_created', 'verification_pending', 'unknown'] },
    }, {
      $set: {
        signatureVerifiedAt,
        razorpayPaymentId,
      },
    })

    const providerPayment = await fetchRazorpayPayment(razorpayPaymentId)
    const verifiedPayment = validateRazorpayPayment(providerPayment, {
      expectedPaymentId: razorpayPaymentId,
      expectedOrderId: payment.razorpayOrderId,
      amountMinor: payment.amountMinor,
    })

    if (verifiedPayment.status === 'authorized') {
      const pendingPayment = await Payment.findOneAndUpdate({
        _id: payment._id,
        client: payment.client,
        razorpayOrderId: payment.razorpayOrderId,
        status: { $in: ['order_created', 'verification_pending', 'unknown'] },
      }, {
        $set: {
          status: 'verification_pending',
          signatureVerifiedAt,
          razorpayPaymentId,
        },
        $unset: { lastErrorCode: 1 },
      }, { new: true })
      return response.status(202).json({
        success: true,
        data: getPaymentResponse(pendingPayment ?? payment),
        message: 'Razorpay payment is authorized but not captured.',
      })
    }

    if (verifiedPayment.status === 'failed') {
      await Payment.updateOne({
        _id: payment._id,
        status: { $in: ['order_created', 'verification_pending', 'unknown'] },
      }, {
        $set: { status: 'failed', lastErrorCode: 'razorpay_payment_failed' },
      })
      return sendError(response, 409, 'Razorpay did not capture this payment.')
    }

    const completedPayment = await Payment.findOneAndUpdate({
      _id: payment._id,
      client: payment.client,
      razorpayOrderId: payment.razorpayOrderId,
      status: { $in: ['order_created', 'verification_pending', 'unknown'] },
    }, {
      $set: {
        status: 'completed',
        signatureVerifiedAt,
        razorpayPaymentId,
        capturedAt: verifiedPayment.created_at
          ? new Date(verifiedPayment.created_at * 1000)
          : new Date(),
      },
      $unset: { lastErrorCode: 1 },
    }, { new: true })
    if (!completedPayment) {
      const current = await Payment.findById(payment._id)
      if (current?.status === 'completed' && current.razorpayPaymentId === razorpayPaymentId) {
        return response.json({ success: true, data: getPaymentResponse(current) })
      }
      return sendError(response, 409, 'Payment state changed during verification.')
    }
    return response.json({ success: true, data: getPaymentResponse(completedPayment) })
  } catch (error) {
    if (error instanceof RazorpayServiceError) {
      if (error.uncertain) {
        await Payment.updateOne({
          _id: new mongoose.Types.ObjectId(paymentId),
          client: new mongoose.Types.ObjectId(request.user.id),
          status: { $in: ['order_created', 'verification_pending', 'unknown'] },
        }, { $set: { status: 'unknown', lastErrorCode: getSafeErrorCode(error) } })
      }
      return sendRazorpayError(response, error)
    }
    return next(error)
  }
}

async function getPaymentStatus(request, response, next) {
  const { paymentId } = request.params
  if (!/^[\da-f]{24}$/i.test(paymentId)) return sendError(response, 400, 'Invalid payment ID.')

  try {
    const payment = await Payment.findOne({
      _id: new mongoose.Types.ObjectId(paymentId),
      client: new mongoose.Types.ObjectId(request.user.id),
    })
    if (!payment) return sendError(response, 404, 'Payment not found.')
    return response.json({ success: true, data: getPaymentResponse(payment) })
  } catch (error) {
    return next(error)
  }
}

export { createRazorpayOrderForAgreement, getPaymentStatus, razorpayVerifyPayment }
