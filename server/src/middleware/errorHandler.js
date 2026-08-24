export const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' })
}

export const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500
  if (req.path.includes('/schools/') && req.path.includes('import')) {
    console.error(`[import-error] ${req.method} ${req.originalUrl} ${status}: ${error.message}`)
  }
  res.status(status).json({
    message: error.message || 'Internal server error'
  })
}
