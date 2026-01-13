import { BuoyModel } from '../models/buoy.model'
import { scheduledUpdate } from '../utils/buoy.service'
import { Request, Response } from 'express'

export class BuoyController {
  static async getBuoys(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6
      const buoy = (req.query.buoy as string) || '7113'
      const buoys = await BuoyModel.getBuoys({ limit, buoy })
      res.json(buoys)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async addNewBuoysToDB(res: Response) {
    try {
      await scheduledUpdate()
      res.status(200).send('Buoy data updated successfully!')
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async deleteBuoys(req: Request, res: Response) {
    try {
      await BuoyModel.deleteBuoys()
      res.status(200).send('Buoy data deleted successfully!')
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }
}
