import { describe, it, expect, vi } from 'vitest'
import {
  formatValue,
  organizeData,
  formatDate,
  updateBuoysData,
} from '../src/utils/buoys'
import { BuoyFetch, id } from '../src/types'

describe('formatValue', () => {
  it('divides by 100 for ids 34, 13, 32', () => {
    expect(formatValue(34, '500')).toBe(5)
    expect(formatValue(13, '200')).toBe(2)
    expect(formatValue(32, '100')).toBe(1)
  })

  it('returns number as is for ids 20, 21', () => {
    expect(formatValue(20, '10')).toBe(10)
    expect(formatValue(21, '15')).toBe(15)
  })

  it('returns 0 for other ids', () => {
    expect(formatValue(99 as unknown as id, '100')).toBe(0)
  })
})

describe('formatDate', () => {
  it('converts date string to timestamp', () => {
    const dateStr = '2023-01-01 12:00:00.0'
    const expected = Date.parse('2023-01-01T12:00:00.000Z')
    expect(formatDate(dateStr)).toBe(expected)
  })
})

describe('organizeData', () => {
  it('organizes buoy data correctly', () => {
    const mockData: BuoyFetch[] = [
      {
        fecha: '2023-01-01 12:00:00.0',
        datos: [
          {
            id: 34,
            valor: '500',
            nombreParametro: 'Periodo de Pico',
            nombreColumna: 'Periodo de Pico',
            paramEseoo: '',
            factor: 1,
            unidad: 's',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 13,
            valor: '200',
            nombreParametro: 'Altura Signif. del Oleaje',
            nombreColumna: 'Altura Signif. del Oleaje',
            paramEseoo: '',
            factor: 1,
            unidad: 'm',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 20,
            valor: '90',
            nombreParametro: 'Direcc. Media de Proced.',
            nombreColumna: 'Direcc. Media de Proced.',
            paramEseoo: '',
            factor: 1,
            unidad: '°',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 21,
            valor: '85',
            nombreParametro: 'Direcc. de pico de proced.',
            nombreColumna: 'Direcc. de pico de proced.',
            paramEseoo: '',
            factor: 1,
            unidad: '°',
            paramQC: true,
            variable: '',
            averia: false,
          },
        ],
      },
    ]

    const result = organizeData(mockData)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      date: Date.parse('2023-01-01T12:00:00.000Z'),
      period: 5,
      height: 2,
      avgDirection: 90,
      peakDirection: 85,
    })
  })

  it('excludes peakDirection if zero', () => {
    const mockData: BuoyFetch[] = [
      {
        fecha: '2023-01-01 12:00:00.0',
        datos: [
          {
            id: 34,
            valor: '500',
            nombreParametro: 'Periodo de Pico',
            nombreColumna: 'Periodo de Pico',
            paramEseoo: '',
            factor: 1,
            unidad: 's',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 13,
            valor: '200',
            nombreParametro: 'Altura Signif. del Oleaje',
            nombreColumna: 'Altura Signif. del Oleaje',
            paramEseoo: '',
            factor: 1,
            unidad: 'm',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 20,
            valor: '90',
            nombreParametro: 'Direcc. Media de Proced.',
            nombreColumna: 'Direcc. Media de Proced.',
            paramEseoo: '',
            factor: 1,
            unidad: '°',
            paramQC: true,
            variable: '',
            averia: false,
          },
          {
            id: 21,
            valor: '0',
            nombreParametro: 'Direcc. de pico de proced.',
            nombreColumna: 'Direcc. de pico de proced.',
            paramEseoo: '',
            factor: 1,
            unidad: '°',
            paramQC: true,
            variable: '',
            averia: false,
          },
        ],
      },
    ]

    const result = organizeData(mockData)

    expect(result[0]).not.toHaveProperty('peakDirection')
  })
})

describe('updateBuoysData', () => {
  it('fetches and organizes data', async () => {
    const mockData = [
      {
        fecha: '2023-01-01 12:00:00.0',
        datos: [
          {
            id: 34,
            valor: '500',
            nombreParametro: 'Periodo de Pico',
            nombreColumna: 'Periodo de Pico',
            paramEseoo: '',
            factor: 1,
            unidad: 's',
            paramQC: true,
            variable: '',
            averia: false,
          },
        ],
      },
    ]
    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockData),
    }
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await updateBuoysData({ station: 'test', body: 'test' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://portus.puertos.es/portussvr/api/RTData/station/test?locale=es',
      expect.any(Object),
    )

    expect(result).toHaveLength(1)
    expect(result[0].period).toBe(5)
  })

  it('returns empty array on fetch error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch error'))

    const result = await updateBuoysData({ station: 'test', body: 'test' })

    expect(result).toEqual([])
    consoleErrorSpy.mockRestore()
  })
})
