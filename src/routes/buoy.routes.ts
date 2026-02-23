import Router from 'express'
import { BuoyController } from '@controllers/buoy.controller'
import { validate } from '../middleware/validate'
import {
  buoyIdSchema,
  buoyNearSchema,
  buoyLimitSchema,
  addBuoySchema,
} from '@schemas/buoy.schema'

export const buoysRouter = Router()

buoysRouter.get(
  '/near',
  validate(buoyNearSchema),
  BuoyController.getNearestBuoys,
)
buoysRouter.get('/', BuoyController.getBuoys)
buoysRouter.get(
  '/:id/data',
  validate(buoyLimitSchema),
  BuoyController.getBuoyData,
)
buoysRouter.get('/:id', validate(buoyIdSchema), BuoyController.getBuoyInfo)
buoysRouter.post('/:id', validate(addBuoySchema), BuoyController.addNewBuoy)
buoysRouter.delete('/', BuoyController.deleteBuoyInfo)
buoysRouter.delete('/data', BuoyController.deleteBuoyData)
