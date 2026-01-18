import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../errors/AppError'

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: typeof req.body
        query?: typeof req.query
        params?: typeof req.params
      }

      if (result.body !== undefined) req.body = result.body
      if (result.query !== undefined) req.query = result.query
      if (result.params !== undefined) req.params = result.params

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')
        throw new ValidationError(message)
      }
      throw error
    }
  }
}
