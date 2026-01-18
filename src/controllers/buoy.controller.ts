import { BuoyDataModel } from '@models/buoyData.model'
import { BuoyInfoModel } from '@models/buoyInfo.model'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'

export class BuoyController {
  static getBuoys = asyncHandler(async (_req: Request, res: Response) => {
    const buoys = await BuoyInfoModel.getAllBuoysInfo()
    res.json(buoys)
  })

  static getBuoyInfo = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const buoyInfo = await BuoyInfoModel.getBuoysInfoById(id)
    res.json(buoyInfo)
  })

  static getBuoyData = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6
    const buoyId = (req.params.id as string) || '7113'
    const buoys = await BuoyDataModel.getBuoys({ limit, buoyId })
    res.json(buoys)
  })

  static addNewBuoy = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { buoyName, location, body } = req.body
    await BuoyInfoModel.addBuoyInfo({ buoyId: id, buoyName, location, body })
    res.status(201).json({ message: 'New buoy added successfully' })
  })

  static deleteBuoyData = asyncHandler(async (_req: Request, res: Response) => {
    await BuoyDataModel.deleteBuoyData()
    res.json({ message: 'Buoy data deleted successfully' })
  })

  static deleteBuoyInfo = asyncHandler(async (req: Request, res: Response) => {
    const id = typeof req.body?.id === 'string' ? req.body.id : undefined
    await BuoyInfoModel.deleteBuoysInfo(id)
    res.json({ message: 'Buoy info deleted successfully' })
  })
}
