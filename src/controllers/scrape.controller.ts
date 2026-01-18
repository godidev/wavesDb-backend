import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { scrapeAll } from '@services/scraper.service'

export class ScrapeController {
  /**
   * Triggers manual scraping of all data sources
   * GET /scrape
   */
  static triggerScrape = asyncHandler(async (_req: Request, res: Response) => {
    const result = await scrapeAll()

    if (result.success) {
      res.status(200).json({
        message: 'Scraping completed successfully!',
        results: result.results,
      })
    } else {
      res.status(207).json({
        message: 'Scraping completed with some failures',
        results: result.results,
      })
    }
  })
}
