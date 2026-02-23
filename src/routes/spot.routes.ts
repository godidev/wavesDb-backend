import Router from 'express'
import { validate } from '../middleware/validate'
import {
  addSpotInfoSchema,
  deleteSpotInfoSchema,
  updateSpotInfoSchema,
} from '@schemas/spot.schema'
import { SpotInfoController } from '@controllers/spot.controller'

export const SpotRouter = Router()

SpotRouter.get('/', SpotInfoController.getAllSpots)
SpotRouter.post(
  '/',
  validate(addSpotInfoSchema),
  SpotInfoController.addSpotInfo,
)
SpotRouter.delete(
  '/',
  validate(deleteSpotInfoSchema),
  SpotInfoController.deleteSpotsInfo,
)
SpotRouter.patch(
  '/:spotId',
  validate(updateSpotInfoSchema),
  SpotInfoController.updateSpotInfo,
)
