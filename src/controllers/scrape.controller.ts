import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { scrapeAll } from '@services/scraper.service'
import { loadEnvironment } from '@config/environment'

const isManualScrapeAuthorized = (req: Request): boolean => {
  const { SCRAPE_API_KEY } = loadEnvironment()
  if (!SCRAPE_API_KEY) return true

  const header = req.header('x-api-key')
  return header === SCRAPE_API_KEY
}

export class ScrapeController {
  /**
   * Triggers manual scraping of all data sources
   * GET /scrape
   */
  static triggerScrape = asyncHandler(async (req: Request, res: Response) => {
    if (!isManualScrapeAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await scrapeAll()

    if (result.success) {
      res.status(200).json({
        message: 'Scraping completed successfully!',
        results: result.results,
        durationMs: result.durationMs,
      })
    } else {
      res.status(207).json({
        message: 'Scraping completed with some failures',
        results: result.results,
        durationMs: result.durationMs,
      })
    }
  })
}
