import { BuoyDataModel } from '@models/buoyData.model'
import { BuoyInfoModel } from '@models/buoyInfo.model'
import { Request, Response } from 'express'

export class BuoyController {
  static async getBuoys(req: Request, res: Response) {
    try {
      const buoys = await BuoyInfoModel.getAllBuoysInfo()
      res.json(buoys)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async getBuoyInfo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const buoyInfo = await BuoyInfoModel.getBuoysInfoById(id)
      res.json(buoyInfo)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async getBuoyData(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6
      const buoy = (req.params.id as string) || '7113'
      const buoys = await BuoyDataModel.getBuoys({ limit, buoy })
      res.json(buoys)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async addNewBuoy(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { buoyName, location, body } = req.body
      await BuoyInfoModel.addBuoyInfo({ buoyId: id, buoyName, location, body })
      res.status(200).send('New buoy added successfully!')
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate key error')) {
        res.status(400).json({ error: 'Buoy with this ID already exists.' })
        return
      }
      res.status(500).json({ error: err })
    }
  }

  static async deleteBuoyData(req: Request, res: Response) {
    try {
      await BuoyDataModel.deleteBuoyData()
      res.status(200).send('Buoy data deleted successfully!')
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async deleteBuoyInfo(req: Request, res: Response) {
    try {
      const id = typeof req.body?.id === 'string' ? req.body.id : undefined
      await BuoyInfoModel.deleteBuoysInfo(id)
      res.status(200).send('Buoy info deleted successfully!')
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('No buoy found with ID')
      ) {
        res.status(404).json({ error: err.message })
        return
      }
      res.status(500).json({ error: err })
    }
  }
}
