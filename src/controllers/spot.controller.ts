import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { SpotInfoModel } from '@models/spotInfo.model'
import {
  AddSpotInfoBody,
  DeleteSpotInfoBody,
  UpdateSpotInfoBody,
  UpdateSpotInfoParams,
} from '@schemas/spot.schema'

export class SpotInfoController {
  static getAllSpots = asyncHandler(async (_req: Request, res: Response) => {
    const spots = await SpotInfoModel.getAllSpotsInfo()
    res.json(spots)
  })

  static addSpotInfo = asyncHandler(async (req: Request, res: Response) => {
    const { spotId, spotName, location, spotUrlName } =
      req.body as AddSpotInfoBody
    const spotData: AddSpotInfoBody = {
      ...(spotId && { spotId }),
      spotName,
      location,
      spotUrlName,
    }
    await SpotInfoModel.addSpotInfo(spotData)
    res.status(201).json({ message: 'New spot info added successfully' })
  })

  static deleteSpotsInfo = asyncHandler(async (req: Request, res: Response) => {
    const { spotId } = req.body as DeleteSpotInfoBody
    if (spotId) {
      await SpotInfoModel.deleteSpotsInfo(spotId)
      res
        .status(200)
        .json({ message: `Spot info with ID ${spotId} deleted successfully` })
      return
    }
    await SpotInfoModel.deleteSpotsInfo()
    res.status(200).json({ message: 'All spot info deleted successfully' })
  })

  static updateSpotInfo = asyncHandler(async (req: Request, res: Response) => {
    const { spotId } = req.params as UpdateSpotInfoParams
    const updateData = req.body as UpdateSpotInfoBody

    await SpotInfoModel.updateSpotInfo(spotId, updateData)
    res.status(200).json({ message: 'Spot info updated successfully' })
  })
}
