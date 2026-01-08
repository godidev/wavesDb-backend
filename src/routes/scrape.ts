import Router, { NextFunction, Response, Request } from 'express'
import cron from 'node-cron'
import { scheduledUpdate as scheduledUpdateBuoys } from '../utils/buoys'
import { updateSurfForecast } from '../utils/surfForecast'

type TaskFunction = () => Promise<void>

export const scrapeRouter = Router()

const executeTask = async (
  taskFn: TaskFunction,
  taskName: string,
): Promise<void> => {
  console.log(`Started ${taskName} at ${new Date().toISOString()}`)
  try {
    await taskFn()
    console.log(
      `${taskName} completed successfully at ${new Date().toISOString()}`,
    )
  } catch (err) {
    console.error(`Error in ${taskName} at ${new Date().toISOString()}:`, err)
  }
}

const scrapeAll = async (res?: Response) => {
  try {
    await executeTask(scheduledUpdateBuoys, 'Scrape of Buoys')
    await executeTask(updateSurfForecast, 'Scrape of Surf-Forecast')

    if (res) {
      res.status(200).json({ message: 'Scraping completed successfully!' })
      return
    }
  } catch (err) {
    console.error('Error in scrapeAll:', err)
    if (res) {
      res.status(500).json({ message: 'Error occurred during scraping' })
      return
    }
    throw err
  }
}

scrapeRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await scrapeAll(res)
    } catch (e) {
      next(e)
    }
  },
)

cron.schedule('05,35 */1 * * *', async () => {
  await scrapeAll()
})
