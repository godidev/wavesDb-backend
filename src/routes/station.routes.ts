import Router from 'express'
import { stationController } from '@controllers/station.controller'
import { validate } from '../middleware/validate'
import { addStationSchema } from '@schemas/station.schema'

export const stationsRouter = Router()

stationsRouter.get('/', stationController.getStations)
stationsRouter.post(
  '/',
  validate(addStationSchema),
  stationController.addNewStation,
)
stationsRouter.delete('/', stationController.deleteStations)
