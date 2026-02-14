import { scheduledUpdate as updateBuoys } from '@utils/buoy.service'
import { updateSurfForecast } from '@utils/surf-forecast.service'
import { logger } from '@logger'

type TaskFunction = () => Promise<void>

interface TaskResult {
  taskName: string
  success: boolean
  error?: string
}

async function executeTask(
  taskFn: TaskFunction,
  taskName: string,
): Promise<TaskResult> {
  const startTime = new Date()
  logger.info(`Started ${taskName}`)

  try {
    await taskFn()
    const duration = Date.now() - startTime.getTime()
    logger.info(`${taskName} completed successfully in ${duration}ms`)
    return { taskName, success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`Error in ${taskName}: ${errorMessage}`)
    return { taskName, success: false, error: errorMessage }
  }
}

export async function scrapeAll(): Promise<{
  success: boolean
  results: TaskResult[]
  durationMs: number
}> {
  logger.info('Starting scrape all operation')
  const startedAt = Date.now()

  const results: TaskResult[] = []

  results.push(await executeTask(updateBuoys, 'Buoy Scraping'))
  results.push(await executeTask(updateSurfForecast, 'Surf Forecast Scraping'))

  const allSuccessful = results.every((r) => r.success)
  const durationMs = Date.now() - startedAt

  if (allSuccessful) {
    logger.info({ durationMs }, 'All scraping tasks completed successfully')
  } else {
    const failed = results.filter((r) => !r.success)
    logger.warn(
      {
        durationMs,
        failedTasks: failed.map((f) => f.taskName),
      },
      `Scraping completed with ${failed.length} failure(s)`,
    )
  }

  return {
    success: allSuccessful,
    results,
    durationMs,
  }
}
