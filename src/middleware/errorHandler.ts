import { ErrorRequestHandler } from 'express'
import { AppError } from '../errors/AppError'
import { logger } from '@logger'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    })
    return
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({
      error: 'Resource already exists',
    })
    return
  }
  logger.error({ err }, `Unexpected error: ${err.message}`)

  res.status(500).json({
    error: 'Internal server error',
  })
}
