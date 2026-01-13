import Router from 'express'
import { SurfForecastController } from '../controllers/surf-forecast.controller'

export const SurfForecastRouter = Router()

SurfForecastRouter.get('/:spot', SurfForecastController.getSurfForecasts)
SurfForecastRouter.delete('/', SurfForecastController.deleteSurfForecast)
