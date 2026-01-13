import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest'
import request from 'supertest'
import app from '../src/index'
import { BuoyModel } from '../src/models/buoy.model'
import { StationModel } from '../src/models/station.model'
import { SurfForecastModel } from '../src/models/surf-forecast.model'
import { WaveData } from '../src/types/surf-forecast.types'

// Set test environment variables
process.env.MONGO_URL = 'mongodb://localhost:27017/test'
process.env.NODE_ENV = 'test'

// Define types for test mocks
type FormatedBuoy = {
  station: string
  date: number
  period: number
  height: number
  avgDirection: number
  peakDirection?: number
}

// Mock the models
vi.mock('../src/models/buoy.model', () => ({
  BuoyModel: {
    getBuoys: vi.fn(),
    deleteBuoys: vi.fn(),
    addMultipleBuoys: vi.fn(),
  },
}))

vi.mock('../src/models/station.model', () => ({
  StationModel: {
    getStations: vi.fn(),
    addStation: vi.fn(),
    deleteStations: vi.fn(),
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

// Mock console methods to suppress logs in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Get typed mocks
const mockGetBuoys = BuoyModel.getBuoys as MockedFunction<
  typeof BuoyModel.getBuoys
>
const mockDeleteBuoys = BuoyModel.deleteBuoys as MockedFunction<
  typeof BuoyModel.deleteBuoys
>
const mockGetStations = StationModel.getStations as MockedFunction<
  typeof StationModel.getStations
>
const mockAddStation = StationModel.addStation as MockedFunction<
  typeof StationModel.addStation
>
const mockDeleteStations = StationModel.deleteStations as MockedFunction<
  typeof StationModel.deleteStations
>
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
    it('should return buoys data', async () => {
      const mockBuoys: FormatedBuoy[] = [
        {
          station: '7113',
          date: 1672574400000,
          period: 5,
          height: 2,
          avgDirection: 90,
          peakDirection: 85,
        },
      ]
      mockGetBuoys.mockResolvedValue(mockBuoys)

      const response = await request(app)
        .get('/buoys')
        .query({ limit: 6, buoy: '7113' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockBuoys)
      expect(mockGetBuoys).toHaveBeenCalledWith({ limit: 6, buoy: '7113' })
    })

    it('should use default values when no query params', async () => {
      const mockBuoys: FormatedBuoy[] = []
      mockGetBuoys.mockResolvedValue(mockBuoys)

      const response = await request(app).get('/buoys')

      expect(response.status).toBe(200)
      expect(mockGetBuoys).toHaveBeenCalledWith({ limit: 6, buoy: '7113' })
    })

    it('should handle errors', async () => {
      mockGetBuoys.mockRejectedValue(new Error('DB error'))

      const response = await request(app).get('/buoys')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /buoys', () => {
    it('should delete buoys and return success message', async () => {
      mockDeleteBuoys.mockResolvedValue(undefined)

      const response = await request(app).delete('/buoys')

      expect(response.status).toBe(200)
      expect(response.text).toBe('Buoy data deleted successfully!')
      expect(mockDeleteBuoys).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      mockDeleteBuoys.mockRejectedValue(new Error('DB error'))

      const response = await request(app).delete('/buoys')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /stations', () => {
    it('should return stations data', async () => {
      const mockStations = [
        { name: 'Station 1', station: '123' },
        { name: 'Station 2', station: '456' },
      ]
      mockGetStations.mockResolvedValue(mockStations)

      const response = await request(app).get('/stations')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockStations)
      expect(mockGetStations).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      mockGetStations.mockRejectedValue(new Error('DB error'))

      const response = await request(app).get('/stations')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /stations', () => {
    it('should add a new station', async () => {
      mockAddStation.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/stations')
        .send({ name: 'New Station', station: '789' })

      expect(response.status).toBe(200)
      expect(response.text).toBe('Station data updated successfully!')
      expect(mockAddStation).toHaveBeenCalledWith({
        name: 'New Station',
        station: '789',
      })
    })

    it('should handle errors', async () => {
      mockAddStation.mockRejectedValue(new Error('DB error'))

      const response = await request(app)
        .post('/stations')
        .send({ name: 'New Station', station: '789' })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /stations', () => {
    it('should delete stations', async () => {
      mockDeleteStations.mockResolvedValue(undefined)

      const response = await request(app).delete('/stations')

      expect(response.status).toBe(200)
      expect(response.text).toBe('Station data deleted successfully!')
      expect(mockDeleteStations).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      mockDeleteStations.mockRejectedValue(new Error('DB error'))

      const response = await request(app).delete('/stations')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /surf-forecast/test-spot', () => {
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
      expect(response.body).toEqual({
        message: 'Scraping completed successfully!',
      })
      expect(mockScheduledUpdate).toHaveBeenCalled()
      expect(mockUpdateSurfForecast).toHaveBeenCalled()
    })

    it('should handle scraping errors gracefully', async () => {
      mockScheduledUpdate.mockRejectedValue(new Error('Scrape error'))
      mockUpdateSurfForecast.mockResolvedValue(undefined)

      const response = await request(app).get('/scrape')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Scraping completed successfully!',
      })
    })
  })
})
