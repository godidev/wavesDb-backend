import { logger } from '@logger'
import { StationModel } from '@models/station.model'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'

export class stationController {
  static getStations = asyncHandler(async (_req: Request, res: Response) => {
    const stations = await StationModel.getStations()
    res.json(stations)
  })

  static addNewStation = asyncHandler(async (req: Request, res: Response) => {
    const { name, station } = req.body
    logger.info(`Adding new station: ${name} with id: ${station}`)
    await StationModel.addStation({ name, station })
    res.status(200).send('Station data updated successfully!')
  })

  static deleteStations = asyncHandler(async (_req: Request, res: Response) => {
    await StationModel.deleteStations()
    res.status(200).send('Station data deleted successfully!')
  })
}
