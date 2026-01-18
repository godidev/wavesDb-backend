import { describe, it, expect } from 'vitest'
import {
  buoyIdSchema,
  buoyLimitSchema,
  addBuoySchema,
} from '../src/schemas/buoy.schema'
import { addStationSchema } from '../src/schemas/station.schema'
import { surfForecastSpotSchema } from '../src/schemas/surf-forecast.schema'

describe('Zod Validation Schemas', () => {
  describe('buoyIdSchema', () => {
    it('should validate correct buoy ID', () => {
      const data = { params: { id: '7113' } }
      const result = buoyIdSchema.parse(data)
      expect(result.params.id).toBe('7113')
    })

    it('should reject empty buoy ID', () => {
      const data = { params: { id: '' } }
      expect(() => buoyIdSchema.parse(data)).toThrow()
    })

    it('should reject missing buoy ID', () => {
      const data = { params: {} }
      expect(() => buoyIdSchema.parse(data)).toThrow()
    })
  })

  describe('buoyLimitSchema', () => {
    it('should validate with default limit', () => {
      const data = { params: { id: '7113' }, query: {} }
      const result = buoyLimitSchema.parse(data)
      expect(result.query.limit).toBe(6)
    })

    it('should validate custom limit within range', () => {
      const data = { params: { id: '7113' }, query: { limit: '50' } }
      const result = buoyLimitSchema.parse(data)
      expect(result.query.limit).toBe(50)
    })

    it('should coerce string limit to number', () => {
      const data = { params: { id: '7113' }, query: { limit: '10' } }
      const result = buoyLimitSchema.parse(data)
      expect(typeof result.query.limit).toBe('number')
      expect(result.query.limit).toBe(10)
    })

    it('should reject limit below minimum (0)', () => {
      const data = { params: { id: '7113' }, query: { limit: '0' } }
      expect(() => buoyLimitSchema.parse(data)).toThrow()
    })

    it('should reject limit above maximum (101)', () => {
      const data = { params: { id: '7113' }, query: { limit: '101' } }
      expect(() => buoyLimitSchema.parse(data)).toThrow()
    })

    it('should reject non-integer limit', () => {
      const data = { params: { id: '7113' }, query: { limit: '5.5' } }
      expect(() => buoyLimitSchema.parse(data)).toThrow()
    })

    it('should reject non-numeric limit', () => {
      const data = { params: { id: '7113' }, query: { limit: 'abc' } }
      expect(() => buoyLimitSchema.parse(data)).toThrow()
    })
  })

  describe('addBuoySchema', () => {
    it('should validate complete buoy data', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test Buoy',
          location: {
            type: 'Point',
            coordinates: [-5.5, 43.5],
          },
          body: 'Optional description',
        },
      }
      const result = addBuoySchema.parse(data)
      expect(result.body.buoyName).toBe('Test Buoy')
      expect(result.body.location.type).toBe('Point')
      expect(result.body.location.coordinates).toEqual([-5.5, 43.5])
    })

    it('should validate without optional body field', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test Buoy',
          location: {
            coordinates: [-5.5, 43.5],
          },
        },
      }
      const result = addBuoySchema.parse(data)
      expect(result.body.location.type).toBe('Point') // default value
      expect(result.body.body).toBeUndefined()
    })

    it('should reject missing buoyName', () => {
      const data = {
        params: { id: '7113' },
        body: {
          location: { coordinates: [-5.5, 43.5] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject empty buoyName', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: '',
          location: { coordinates: [-5.5, 43.5] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject invalid coordinates (only one value)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [-5.5] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject invalid coordinates (too many values)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [-5.5, 43.5, 100] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject longitude out of range (< -180)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [-181, 43.5] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject longitude out of range (> 180)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [181, 43.5] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject latitude out of range (< -90)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [-5.5, -91] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })

    it('should reject latitude out of range (> 90)', () => {
      const data = {
        params: { id: '7113' },
        body: {
          buoyName: 'Test',
          location: { coordinates: [-5.5, 91] },
        },
      }
      expect(() => addBuoySchema.parse(data)).toThrow()
    })
  })

  describe('addStationSchema', () => {
    it('should validate complete station data', () => {
      const data = {
        body: {
          name: 'Test Station',
          station: '123',
        },
      }
      const result = addStationSchema.parse(data)
      expect(result.body.name).toBe('Test Station')
      expect(result.body.station).toBe('123')
    })

    it('should reject missing name', () => {
      const data = {
        body: {
          station: '123',
        },
      }
      expect(() => addStationSchema.parse(data)).toThrow()
    })

    it('should reject empty name', () => {
      const data = {
        body: {
          name: '',
          station: '123',
        },
      }
      expect(() => addStationSchema.parse(data)).toThrow()
    })

    it('should reject missing station', () => {
      const data = {
        body: {
          name: 'Test Station',
        },
      }
      expect(() => addStationSchema.parse(data)).toThrow()
    })

    it('should reject empty station', () => {
      const data = {
        body: {
          name: 'Test Station',
          station: '',
        },
      }
      expect(() => addStationSchema.parse(data)).toThrow()
    })
  })

  describe('surfForecastSpotSchema', () => {
    it('should validate correct spot parameter with defaults', () => {
      const data = { params: { spot: 'test-spot' }, query: {} }
      const result = surfForecastSpotSchema.parse(data)
      expect(result.params.spot).toBe('test-spot')
      expect(result.query.page).toBe(1)
      expect(result.query.limit).toBe(50)
    })

    it('should validate with custom page and limit', () => {
      const data = {
        params: { spot: 'test-spot' },
        query: { page: 2, limit: 100 },
      }
      const result = surfForecastSpotSchema.parse(data)
      expect(result.params.spot).toBe('test-spot')
      expect(result.query.page).toBe(2)
      expect(result.query.limit).toBe(100)
    })

    it('should coerce string query params to numbers', () => {
      const data = {
        params: { spot: 'test-spot' },
        query: { page: '3', limit: '75' },
      }
      const result = surfForecastSpotSchema.parse(data)
      expect(result.query.page).toBe(3)
      expect(result.query.limit).toBe(75)
    })

    it('should reject page below minimum', () => {
      const data = {
        params: { spot: 'test-spot' },
        query: { page: 0, limit: 50 },
      }
      expect(() => surfForecastSpotSchema.parse(data)).toThrow()
    })

    it('should reject limit above maximum', () => {
      const data = {
        params: { spot: 'test-spot' },
        query: { page: 1, limit: 201 },
      }
      expect(() => surfForecastSpotSchema.parse(data)).toThrow()
    })

    it('should reject limit below minimum', () => {
      const data = {
        params: { spot: 'test-spot' },
        query: { page: 1, limit: 0 },
      }
      expect(() => surfForecastSpotSchema.parse(data)).toThrow()
    })

    it('should reject empty spot', () => {
      const data = { params: { spot: '' }, query: {} }
      expect(() => surfForecastSpotSchema.parse(data)).toThrow()
    })

    it('should reject missing spot', () => {
      const data = { params: {}, query: {} }
      expect(() => surfForecastSpotSchema.parse(data)).toThrow()
    })
  })
})
