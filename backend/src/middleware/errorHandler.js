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

  response.status(status).json({
    error: status === 500 ? 'Internal server error.' : error.message,
  })
}

export { errorHandler }
