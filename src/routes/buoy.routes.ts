import Router from 'express'
import { BuoyController } from '@controllers/buoy.controller'

export const buoysRouter = Router()

buoysRouter.get('/', BuoyController.getBuoys)
buoysRouter.get('/:id/data', BuoyController.getBuoyData)
buoysRouter.get('/:id', BuoyController.getBuoyInfo)
buoysRouter.post('/:id', BuoyController.addNewBuoy)
buoysRouter.delete('/', BuoyController.deleteBuoyInfo)
buoysRouter.delete('/data', BuoyController.deleteBuoyData)
