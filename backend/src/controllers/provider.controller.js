import mongoose from 'mongoose'
import Provider from '../models/Provider.js'

async function getProviders(request, response, next) {
  try {
    const providers = await Provider.find().sort({ createdAt: -1, _id: -1 })
    return response.json({
      success: true,
      data: providers,
    })
  } catch (error) {
    return next(error)
  }
}

async function getProviderById(request, response, next) {
  const { id } = request.params
  if (!/^[\da-f]{24}$/i.test(id)) {
    return response.status(400).json({
      success: false,
      error: 'Invalid provider ID.',
    })
  }

  try {
    const provider = await Provider.findById(new mongoose.Types.ObjectId(id))
    if (!provider) {
      return response.status(404).json({
        success: false,
        error: 'Provider not found.',
      })
    }

    return response.json({
      success: true,
      data: provider,
    })
  } catch (error) {
    return next(error)
  }
}

export { getProviderById, getProviders }
