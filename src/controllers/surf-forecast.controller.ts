import { SurfForecastModel } from '@models/surf-forecast.model'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { NotFoundError } from '../errors/AppError'

export class SurfForecastController {
  static getHourlySurfForecasts = asyncHandler(
    async (req: Request, res: Response) => {
      const { spotId } = req.params
      const { page, limit } = req.query

      const forecasts = await SurfForecastModel.getSurfForecasts({
        spotId,
        page: Number(page),
        limit: Number(limit),
        source: 'hourly_48h',
      })

      if (!forecasts.length) {
        throw new NotFoundError('No forecasts found for the specified spot')
      }

      res.json(forecasts)
    },
  )

  static getGeneralSurfForecasts = asyncHandler(
    async (req: Request, res: Response) => {
      const { spotId } = req.params
      const { page, limit } = req.query

      const forecasts = await SurfForecastModel.getSurfForecasts({
        spotId,
        page: Number(page),
        limit: Number(limit),
        source: 'general_7d',
      })

      if (!forecasts.length) {
        throw new NotFoundError('No forecasts found for the specified spot')
      }

      res.json(forecasts)
    },
  )

  static deleteSurfForecast = asyncHandler(
    async (req: Request, res: Response) => {
      await SurfForecastModel.deleteSurfForecast()
      res.status(200).send('Surf Forecast data deleted successfully!')
    },
  )
}
