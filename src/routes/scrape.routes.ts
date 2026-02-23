import Router from 'express'
import { ScrapeController } from '@controllers/scrape.controller'

export const scrapeRouter = Router()

scrapeRouter.get('/breaks', ScrapeController.scrapeSurfForecastBreaks)
scrapeRouter.get('/', ScrapeController.triggerScrape)
