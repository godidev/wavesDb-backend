import Router, { NextFunction, Response, Request } from 'express'
import cron from 'node-cron'
import { scheduledUpdate as scheduledUpdateBuoys } from '@utils/buoy.service'
import { updateSurfForecast } from '@utils/surf-forecast.service'
import { logger } from '@logger'

type TaskFunction = () => Promise<void>

export const scrapeRouter = Router()

const executeTask = async (
  taskFn: TaskFunction,
  taskName: string,
): Promise<void> => {
  logger.info(`Started ${taskName} at ${new Date().toISOString()}`)
  try {
    await taskFn()
    logger.info(
      `${taskName} completed successfully at ${new Date().toISOString()}`,
    )
  } catch (err) {
    logger.error(`Error in ${taskName} at ${new Date().toISOString()}: ${err}`)
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
    logger.error(`Error during scraping all data: ${err}`)
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
