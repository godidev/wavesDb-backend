import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { SpotInfoModel } from '@models/spotInfo.model'

export class SpotInfoController {
  static getAllSpots = asyncHandler(async (_req: Request, res: Response) => {
    const spots = await SpotInfoModel.getAllSpotsInfo()
    res.json(spots)
  })

  static addSpotInfo = asyncHandler(async (req: Request, res: Response) => {
    const { spotName, location } = req.body
    await SpotInfoModel.addSpotInfo({ spotName, location })
    res.status(201).json({ message: 'New spot info added successfully' })
  })

  static deleteSpotsInfo = asyncHandler(async (req: Request, res: Response) => {
    await SpotInfoModel.deleteSpotsInfo()
    res.status(200).send('Spot info deleted successfully!')
  })
}
