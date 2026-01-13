import Router from 'express'
import { BuoyController } from '../controllers/buoy.controller'

export const buoysRouter = Router()

buoysRouter.get('/', BuoyController.getBuoys)
buoysRouter.delete('/', BuoyController.deleteBuoys)
