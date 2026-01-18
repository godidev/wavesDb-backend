import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeAll } from '../src/services/scraper.service'
import { initializeScheduler } from '../src/services/scheduler.service'

// Mock dependencies
vi.mock('../src/utils/buoy.service', () => ({
  scheduledUpdate: vi.fn(),
}))

vi.mock('../src/utils/surf-forecast.service', () => ({
  updateSurfForecast: vi.fn(),
}))

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((_schedule, _callback, _options) => {
      // Return a mock task object
      return { start: vi.fn(), stop: vi.fn() }
    }),
    validate: vi.fn((schedule) => {
      // Simple validation: must have 5 parts
      return schedule.split(' ').length === 5
    }),
  },
}))

// Mock logger
vi.mock('../src/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('Scraper Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scrapeAll', () => {
    it('should return success when all tasks complete', async () => {
      const { scheduledUpdate } = await import('../src/utils/buoy.service')
      const { updateSurfForecast } = await import(
        '../src/utils/surf-forecast.service'
      )

      vi.mocked(scheduledUpdate).mockResolvedValue(undefined)
      vi.mocked(updateSurfForecast).mockResolvedValue(undefined)

      const result = await scrapeAll()

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].success).toBe(true)
      expect(result.results[1].success).toBe(true)
    })

    it('should handle partial failures', async () => {
      const { scheduledUpdate } = await import('../src/utils/buoy.service')
      const { updateSurfForecast } = await import(
        '../src/utils/surf-forecast.service'
      )

      vi.mocked(scheduledUpdate).mockRejectedValue(new Error('Buoy error'))
      vi.mocked(updateSurfForecast).mockResolvedValue(undefined)

      const result = await scrapeAll()

      expect(result.success).toBe(false)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].success).toBe(false)
      expect(result.results[0].error).toBe('Buoy error')
      expect(result.results[1].success).toBe(true)
    })

    it('should handle all failures', async () => {
      const { scheduledUpdate } = await import('../src/utils/buoy.service')
      const { updateSurfForecast } = await import(
        '../src/utils/surf-forecast.service'
      )

      vi.mocked(scheduledUpdate).mockRejectedValue(new Error('Buoy error'))
      vi.mocked(updateSurfForecast).mockRejectedValue(
        new Error('Forecast error'),
      )

      const result = await scrapeAll()

      expect(result.success).toBe(false)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].success).toBe(false)
      expect(result.results[1].success).toBe(false)
    })

    it('should log task duration', async () => {
      const { scheduledUpdate } = await import('../src/utils/buoy.service')
      const { updateSurfForecast } = await import(
        '../src/utils/surf-forecast.service'
      )
      const { logger } = await import('../src/logger')

      vi.mocked(scheduledUpdate).mockResolvedValue(undefined)
      vi.mocked(updateSurfForecast).mockResolvedValue(undefined)

      await scrapeAll()

      // Check that completion logs include duration
      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        expect.stringContaining('completed successfully in'),
      )
    })
  })

  describe('initializeScheduler', () => {
    it('should initialize scheduler successfully', async () => {
      const cron = await import('node-cron')
      const { logger } = await import('../src/logger')

      expect(() => initializeScheduler()).not.toThrow()

      expect(vi.mocked(cron.default.validate)).toHaveBeenCalledWith(
        '05,35 */1 * * *',
      )
      expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledWith(
        '05,35 */1 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Europe/Madrid',
        }),
      )
      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        expect.stringContaining('Scraping scheduler initialized'),
      )
    })

    it('should throw error for invalid cron schedule', async () => {
      const cron = await import('node-cron')

      // Mock validate to return false
      vi.mocked(cron.default.validate).mockReturnValueOnce(false)

      expect(() => initializeScheduler()).toThrow('Invalid cron schedule')
    })

    it('should throw error if task creation fails', async () => {
      const cron = await import('node-cron')

      // Mock schedule to return null
      vi.mocked(cron.default.schedule).mockReturnValueOnce(null as never)

      expect(() => initializeScheduler()).toThrow(
        'Failed to create scheduled task',
      )
    })
  })
})
