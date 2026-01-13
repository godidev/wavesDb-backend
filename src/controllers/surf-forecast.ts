import { logger } from '../logger'
import { SurfForecastModel } from '../models/surf-forecast'
import { Request, Response } from 'express'

export class SurfForecastController {
  static async getSurfForecasts(req: Request, res: Response) {
    try {
      const { page, limit } = req.query
      const spot = req.params.spot
      if (!spot) {
        res.status(400).json({ error: 'Spot parameter is required' })
        return
      }
      const pageNumber = Math.max(1, Number(page ?? 1) || 1)
      const limitNumber = Math.min(200, Math.max(1, Number(limit ?? 50) || 50))

      const forecasts = await SurfForecastModel.getSurfForecasts({
        spot,
        page: pageNumber,
        limit: limitNumber,
      })
      if (!forecasts.length) {
        res
          .status(404)
          .json({ error: 'No forecasts found for the specified spot' })
        return
      }
      res.json(forecasts)
    } catch (err) {
      logger.error(`Error getting surf forecasts: ${err}`)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  static async deleteSurfForecast(req: Request, res: Response) {
    try {
      await SurfForecastModel.deleteSurfForecast()
      res.status(200).send('Surf Forecast data deleted successfully!')
    } catch (err) {
      logger.error(`Error deleting surf forecasts: ${err}`)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
