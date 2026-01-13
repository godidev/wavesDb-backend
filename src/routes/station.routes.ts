import Router from 'express'
import { stationController } from '@controllers/station.controller'

export const stationsRouter = Router()

stationsRouter.get('/', stationController.getStations)
stationsRouter.post('/', stationController.addNewStation)
stationsRouter.delete('/', stationController.deleteStations)
