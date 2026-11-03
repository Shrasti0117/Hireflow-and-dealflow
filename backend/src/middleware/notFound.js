function notFound(request, response) {
  response.status(404).json({
    error: `Route not found: ${request.method} ${request.path}`,
  })
}

export { notFound }
