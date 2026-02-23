import Router from 'express'
import { validate } from '../middleware/validate'
import { addSpotInfoSchema } from '@schemas/surf-forecast.schema'
import { SpotInfoController } from '@controllers/spot.controller'

export const SpotRouter = Router()

SpotRouter.get('/', SpotInfoController.getAllSpots)
SpotRouter.post(
  '/',
  validate(addSpotInfoSchema),
  SpotInfoController.addSpotInfo,
)
SpotRouter.delete('/', SpotInfoController.deleteSpotsInfo)
