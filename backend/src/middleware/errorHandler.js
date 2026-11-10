function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500

  if (status === 500) {
    console.error(`Unhandled request error (${error.name || 'Error'}).`)
  }

  const safeMessages = {
    400: 'Invalid request.',
    401: 'Authentication required.',
    403: 'Access denied.',
    404: 'Resource not found.',
    409: 'Request conflicts with existing data.',
    413: 'Request is too large.',
    415: 'Unsupported request content type.',
    422: 'Request could not be processed.',
    429: 'Too many requests. Please try again later.',
  }

  response.status(status).json({
    error: safeMessages[status] || (status === 500 ? 'Internal server error.' : 'Request failed.'),
  })
}

export { errorHandler }
