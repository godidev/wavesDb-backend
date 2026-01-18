import Router from 'express'
import { ScrapeController } from '@controllers/scrape.controller'

export const scrapeRouter = Router()

scrapeRouter.get('/', ScrapeController.triggerScrape)
