import { scheduledUpdate as updateBuoys } from '@utils/buoy.service'
import { updateSurfForecast } from '@utils/surf-forecast.service'
import { logger } from '@logger'
import { SpotInfoModel } from '@models/spotInfo.model'
import * as cheerio from 'cheerio'

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

export async function fetchAndUpdateSurfForecastBreaks() {
  try {
    const result = await fetch(
      'https://www.surf-forecast.com/countries/Spain/breaks',
      {
        method: 'GET',
        headers: {
          accept: 'text/html',
          'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
          'user-agent':
            'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
      },
    )
    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`)
    }
    const html = await result.text()

    const $ = cheerio.load(html)

    const breaks = $('td>a')
      .toArray()
      .map((el) => {
        const element = $(el)
        const name = element.text().trim()
        const url = element.attr('href')?.split('/').slice(-1)[0] || ''
        return { [name]: url }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    for (const [spotName, spotUrl] of Object.entries(breaks)) {
      await SpotInfoModel.addSpotInfo({
        spotName,
        spotUrlName: spotUrl,
        location: { type: 'Point', coordinates: [0, 0] },
        active: false,
      })
    }

    return breaks
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      'Error updating surf forecast breaks',
    )
  }
}
