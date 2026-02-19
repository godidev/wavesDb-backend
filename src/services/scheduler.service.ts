import cron from 'node-cron'
import { scrapeAll } from './scraper.service'
import { logger } from '@logger'

export function initializeScheduler(): void {
  try {
    const schedule = '05,35 */1 * * *'

    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    const task = cron.schedule(
      schedule,
      async () => {
        logger.info('Scheduled scraping task triggered')
        try {
          const result = await scrapeAll()
          logger.info(
            {
              success: result.success,
              durationMs: result.durationMs,
            },
            'Scheduled scraping task finished',
          )
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          logger.error(`Scheduled scraping task failed: ${errorMessage}`)
        }
      },
      {
        scheduled: true,
        timezone: 'Europe/Madrid',
      },
    )

    if (!task) {
      throw new Error('Failed to create scheduled task')
    }

    logger.info(`Scraping scheduler initialized with schedule: ${schedule}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`Failed to initialize scheduler: ${errorMessage}`)
    throw new Error(`Scheduler initialization failed: ${errorMessage}`)
  }
}
