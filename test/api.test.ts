import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest'
import request from 'supertest'
import app from '../src/index'
import { BuoyDataModel } from '../src/models/buoyData.model'
import { BuoyInfoModel } from '../src/models/buoyInfo.model'
import { SurfForecastModel } from '../src/models/surf-forecast.model'
import { WaveData } from '../src/types/surf-forecast.types'

// Set test environment variables
process.env.MONGO_URL = 'mongodb://localhost:27017/test'
process.env.NODE_ENV = 'test'

// Mock the models
vi.mock('../src/models/buoyData.model', () => ({
  BuoyDataModel: {
    getBuoys: vi.fn(),
    deleteBuoyData: vi.fn(),
  },
}))

vi.mock('../src/models/buoyInfo.model', () => ({
  BuoyInfoModel: {
    getAllBuoysInfo: vi.fn(),
    getBuoysInfoById: vi.fn(),
    addBuoyInfo: vi.fn(),
    deleteBuoysInfo: vi.fn(),
  },
}))

vi.mock('../src/models/surf-forecast.model', () => ({
  SurfForecastModel: {
    getSurfForecasts: vi.fn(),
    deleteSurfForecast: vi.fn(),
    addMultipleForecast: vi.fn(),
  },
}))

// Mock the utils
vi.mock('../src/utils/buoy.service', () => ({
  scheduledUpdate: vi.fn(),
}))

vi.mock('../src/utils/surf-forecast.service', () => ({
  updateSurfForecast: vi.fn(),
}))

// Mock scheduler service to prevent cron from starting in tests
vi.mock('../src/services/scheduler.service', () => ({
  initializeScheduler: vi.fn(),
}))

// Mock console methods to suppress logs in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Get typed mocks for BuoyDataModel
const mockGetBuoys = BuoyDataModel.getBuoys as MockedFunction<
  typeof BuoyDataModel.getBuoys
>
const mockDeleteBuoyData = BuoyDataModel.deleteBuoyData as MockedFunction<
  typeof BuoyDataModel.deleteBuoyData
>

// Get typed mocks for BuoyInfoModel
const mockGetAllBuoysInfo = BuoyInfoModel.getAllBuoysInfo as MockedFunction<
  typeof BuoyInfoModel.getAllBuoysInfo
>
const mockGetBuoysInfoById = BuoyInfoModel.getBuoysInfoById as MockedFunction<
  typeof BuoyInfoModel.getBuoysInfoById
>
const mockAddBuoyInfo = BuoyInfoModel.addBuoyInfo as MockedFunction<
  typeof BuoyInfoModel.addBuoyInfo
>
const mockDeleteBuoysInfo = BuoyInfoModel.deleteBuoysInfo as MockedFunction<
  typeof BuoyInfoModel.deleteBuoysInfo
>

// Get typed mocks for SurfForecastModel
const mockGetSurfForecasts =
  SurfForecastModel.getSurfForecasts as MockedFunction<
    typeof SurfForecastModel.getSurfForecasts
  >
const mockDeleteSurfForecast =
  SurfForecastModel.deleteSurfForecast as MockedFunction<
    typeof SurfForecastModel.deleteSurfForecast
  >

// Import and type the utils mocks
const { scheduledUpdate } = await import('../src/utils/buoy.service')
const { updateSurfForecast } = await import(
  '../src/utils/surf-forecast.service'
)
const mockScheduledUpdate = scheduledUpdate as MockedFunction<
  typeof scheduledUpdate
>
const mockUpdateSurfForecast = updateSurfForecast as MockedFunction<
  typeof updateSurfForecast
>

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /buoys', () => {
    it('should return all buoys info', async () => {
      const mockBuoys = [
        {
          buoyId: '7113',
          buoyName: 'Test Buoy',
          location: { type: 'Point' as const, coordinates: [-5.5, 43.5] },
        },
      ]
      mockGetAllBuoysInfo.mockResolvedValue(mockBuoys)

      const response = await request(app).get('/buoys')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockBuoys)
      expect(mockGetAllBuoysInfo).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      mockGetAllBuoysInfo.mockRejectedValue(new Error('DB error'))

      const response = await request(app).get('/buoys')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /buoys/:id', () => {
    it('should return buoy info by id', async () => {
      const mockBuoy = {
        buoyId: '7113',
        buoyName: 'Test Buoy',
        location: { type: 'Point' as const, coordinates: [-5.5, 43.5] },
      }
      mockGetBuoysInfoById.mockResolvedValue(mockBuoy)

      const response = await request(app).get('/buoys/7113')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockBuoy)
      expect(mockGetBuoysInfoById).toHaveBeenCalledWith('7113')
    })

    it('should return 404 for missing buoy ID', async () => {
      const response = await request(app).get('/buoys/')

      expect(response.status).toBe(500)
    })
  })

  describe('GET /buoys/:id/data', () => {
    it('should return buoy data with default limit', async () => {
      const mockData = [
        {
          buoyId: '7113',
          date: '2026-01-07T18:18:54.583Z',
          waveHeight: 2.5,
          period: 8,
        },
      ]
      mockGetBuoys.mockResolvedValue(mockData)

      const response = await request(app).get('/buoys/7113/data')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockData)
      expect(mockGetBuoys).toHaveBeenCalledWith({ limit: 6, buoyId: '7113' })
    })

    it('should return buoy data with custom limit', async () => {
      const mockData: Array<{
        buoyId: string
        date: string
        waveHeight: number
        period: number
      }> = []
      mockGetBuoys.mockResolvedValue(mockData)

      const response = await request(app).get('/buoys/7113/data?limit=10')

      expect(response.status).toBe(200)
      expect(mockGetBuoys).toHaveBeenCalledWith({ limit: 10, buoyId: '7113' })
    })

    it('should reject invalid limit (too high)', async () => {
      const response = await request(app).get('/buoys/7113/data?limit=200')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject invalid limit (negative)', async () => {
      const response = await request(app).get('/buoys/7113/data?limit=-5')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /buoys/:id', () => {
    it('should add a new buoy', async () => {
      mockAddBuoyInfo.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/buoys/7113')
        .send({
          buoyName: 'New Buoy',
          location: {
            type: 'Point',
            coordinates: [-5.5, 43.5],
          },
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({ message: 'New buoy added successfully' })
      expect(mockAddBuoyInfo).toHaveBeenCalledWith({
        buoyId: '7113',
        buoyName: 'New Buoy',
        location: {
          type: 'Point',
          coordinates: [-5.5, 43.5],
        },
        body: undefined,
      })
    })

    it('should reject invalid coordinates (wrong format)', async () => {
      const response = await request(app)
        .post('/buoys/7113')
        .send({
          buoyName: 'New Buoy',
          location: {
            coordinates: [-5.5], // Missing latitude
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject missing buoyName', async () => {
      const response = await request(app)
        .post('/buoys/7113')
        .send({
          location: {
            coordinates: [-5.5, 43.5],
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /buoys/data', () => {
    it('should delete buoy data', async () => {
      mockDeleteBuoyData.mockResolvedValue(undefined)

      const response = await request(app).delete('/buoys/data')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Buoy data deleted successfully',
      })
      expect(mockDeleteBuoyData).toHaveBeenCalled()
    })
  })

  describe('DELETE /buoys', () => {
    it('should delete buoy info', async () => {
      mockDeleteBuoysInfo.mockResolvedValue(undefined)

      const response = await request(app).delete('/buoys')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Buoy info deleted successfully',
      })
      expect(mockDeleteBuoysInfo).toHaveBeenCalledWith(undefined)
    })
  })

  describe('GET /surf-forecast/:spot', () => {
    it('should return surf forecasts', async () => {
      const mockForecasts: WaveData[] = [
        {
          date: new Date('2026-01-07T18:18:54.583Z'),
          spot: 'test-spot',
          validSwells: [],
          wind: { speed: 10, angle: 180 },
          energy: 500,
        },
      ]
      mockGetSurfForecasts.mockResolvedValue(mockForecasts)

      const response = await request(app)
        .get('/surf-forecast/test-spot')
        .query({ page: 1, limit: 50 })

      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        {
          date: '2026-01-07T18:18:54.583Z',
          spot: 'test-spot',
          validSwells: [],
          wind: { speed: 10, angle: 180 },
          energy: 500,
        },
      ])
      expect(mockGetSurfForecasts).toHaveBeenCalledWith({
        spot: 'test-spot',
        page: 1,
        limit: 50,
      })
    })

    it('should use default values', async () => {
      const mockForecasts: WaveData[] = []
      mockGetSurfForecasts.mockResolvedValue(mockForecasts)

      await request(app).get('/surf-forecast/test-spot')

      expect(mockGetSurfForecasts).toHaveBeenCalledWith({
        spot: 'test-spot',
        page: 1,
        limit: 50,
      })
    })

    it('should handle errors', async () => {
      mockGetSurfForecasts.mockRejectedValue(new Error('DB error'))

      const response = await request(app).get('/surf-forecast/test-spot')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /surf-forecast', () => {
    it('should delete surf forecasts', async () => {
      mockDeleteSurfForecast.mockResolvedValue(undefined)

      const response = await request(app).delete('/surf-forecast')

      expect(response.status).toBe(200)
      expect(response.text).toBe('Surf Forecast data deleted successfully!')
      expect(mockDeleteSurfForecast).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      mockDeleteSurfForecast.mockRejectedValue(new Error('DB error'))

      const response = await request(app).delete('/surf-forecast')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /scrape', () => {
    it('should trigger scraping and return success', async () => {
      mockScheduledUpdate.mockResolvedValue(undefined)
      mockUpdateSurfForecast.mockResolvedValue(undefined)

      const response = await request(app).get('/scrape')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toBe('Scraping completed successfully!')
      expect(response.body).toHaveProperty('results')
      expect(mockScheduledUpdate).toHaveBeenCalled()
      expect(mockUpdateSurfForecast).toHaveBeenCalled()
    })

    it('should handle partial scraping failures', async () => {
      mockScheduledUpdate.mockRejectedValue(new Error('Scrape error'))
      mockUpdateSurfForecast.mockResolvedValue(undefined)

      const response = await request(app).get('/scrape')

      expect(response.status).toBe(207) // Multi-Status
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toBe(
        'Scraping completed with some failures',
      )
      expect(response.body).toHaveProperty('results')
      expect(response.body.results).toHaveLength(2)
    })
  })
})
