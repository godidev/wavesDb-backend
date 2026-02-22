import { DateTime } from 'luxon'
import * as cheerio from 'cheerio'
import { SurfForecastModel } from '@models/surf-forecast.model'
import {
  DataDateType,
  DataSwellEnergyType,
  DataSwellStateType,
  DataWindStateType,
  ResponseDaily,
  ResponseHourly,
  WaveData,
} from '@myTypes/surf-forecast.types'
import spots from '@data/surf-forecast/surf-spots.json'
import { logger } from '@logger'

const SURF_FORECAST_TIMEOUT_MS = 12000
const SURF_FORECAST_MAX_RETRIES = 3

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const getBackoffDelay = (attempt: number) => 750 * 2 ** (attempt - 1)

async function fetchSurfForecast7Days(beach: string): Promise<string> {
  const url = `https://es.surf-forecast.com/breaks/${beach}/forecasts/data?&parts=all&period_types=p`

  for (let attempt = 1; attempt <= SURF_FORECAST_MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, SURF_FORECAST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
          'user-agent':
            'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as ResponseHourly
      const content = data.period_types?.p?.parts.basic.content

      if (!content) {
        throw new Error('Missing 7 day forecast content in upstream response')
      }

      return content
    } catch (err) {
      const isLastAttempt = attempt === SURF_FORECAST_MAX_RETRIES
      const message = err instanceof Error ? err.message : String(err)

      if (isLastAttempt) {
        throw new Error(
          `Error fetching 7day surf forecast for ${beach}: ${message}`,
        )
      }

      await sleep(getBackoffDelay(attempt))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(`Error fetching surf forecast for ${beach}`)
}

async function fetchSurfForecastHourly(beach: string): Promise<string> {
  const url = `https://es.surf-forecast.com/breaks/${beach}/forecasts/data?parts=basic&period_types=h&forecast_duration=48h`

  for (let attempt = 1; attempt <= SURF_FORECAST_MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, SURF_FORECAST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
          'user-agent':
            'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as ResponseDaily
      const content = data.period_types?.h?.parts.basic.content

      if (!content) {
        throw new Error('Missing forecast content in upstream response')
      }

      return content
    } catch (err) {
      const isLastAttempt = attempt === SURF_FORECAST_MAX_RETRIES
      const message = err instanceof Error ? err.message : String(err)

      if (isLastAttempt) {
        throw new Error(`Error fetching surf forecast for ${beach}: ${message}`)
      }

      await sleep(getBackoffDelay(attempt))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(`Error fetching surf forecast for ${beach}`)
}

export async function parseHourlyForecast(
  spot: string,
  html: string,
): Promise<WaveData[]> {
  const now = new Date()
  let month = now.getMonth()
  let year = now.getFullYear()
  let lastSeenDay = 0

  const convertDate = ({ day, hour }: { day: number; hour: number }) => {
    if (day < lastSeenDay) {
      month += 1
      if (month > 11) {
        month = 0
        year += 1
      }
    }
    lastSeenDay = day
    return madridToUtcDate(year, month, day, hour)
  }

  const $ = cheerio.load(html)

  const waves = $('td.forecast-table__cell.forecast-table-wave-height__cell')

  const data: WaveData[] = []

  waves.each((index, element) => {
    const waveElement = $(element)
    const dataDate = waveElement.attr('data-date') as DataDateType
    const dataSwellState = JSON.parse(
      waveElement.attr('data-swell-state') as string,
    ) as DataSwellStateType
    const dataWind = JSON.parse(
      waveElement.attr('data-wind') as string,
    ) as DataWindStateType
    const energy = JSON.parse(
      waveElement.attr('data-swell-energies') as string,
    ) as DataSwellEnergyType
    const energyValue = energy.length > 0 ? energy[0].value : 0

    if (!dataDate || !dataSwellState || !dataWind) {
      logger.debug(
        { spot, index, dataDate, dataSwellState, dataWind },
        'Skipping cell with missing attributes',
      )
      return
    }

    const [day, hour] = getHourlyDate(dataDate)
    const finalDate = convertDate({ day, hour })

    const validSwells = dataSwellState
      .filter((item) => item !== null)
      .map(({ period, angle, height }) => ({
        angle: invert(angle),
        height,
        period,
      }))

    const {
      speed,
      direction: { angle: windAngle },
    } = dataWind

    data.push({
      date: finalDate,
      spot,
      validSwells,
      wind: {
        speed: Number(speed) || 0,
        angle: invert(windAngle) || 0,
      },
      energy: Number(energyValue) || 0,
      source: 'hourly_48h',
    })
  })
  return data
}

export async function parseGeneralForecast(
  spot: string,
  html: string,
): Promise<WaveData[]> {
  const now = new Date()
  let month = now.getMonth()
  let year = now.getFullYear()
  let lastSeenDay = 0

  const convertDate = ({ day, hour }: { day: number; hour: number }) => {
    if (day < lastSeenDay) {
      month += 1
      if (month > 11) {
        month = 0
        year += 1
      }
    }
    lastSeenDay = day
    return madridToUtcDate(year, month, day, hour)
  }

  const $ = cheerio.load(html)

  const waves = $('td.forecast-table__cell.forecast-table-wave-height__cell')

  const data: WaveData[] = []

  waves.each((index, element) => {
    const waveElement = $(element)
    const dataDate = waveElement.attr('data-date') as DataDateType
    const dataSwellState = JSON.parse(
      waveElement.attr('data-swell-state') as string,
    ) as DataSwellStateType
    const dataWind = JSON.parse(
      waveElement.attr('data-wind') as string,
    ) as DataWindStateType
    const energy = JSON.parse(
      waveElement.attr('data-swell-energies') as string,
    ) as DataSwellEnergyType
    const energyValue = energy.length > 0 ? energy[0].value : 0

    if (!dataDate || !dataSwellState || !dataWind) {
      logger.debug(
        { spot, index, dataDate, dataSwellState, dataWind },
        'Skipping cell with missing attributes',
      )
      return
    }

    const [day, hour] = getGeneralDate(dataDate)
    const finalDate = convertDate({ day, hour })

    const validSwells = dataSwellState
      .filter((item) => item !== null)
      .map(({ period, angle, height }) => ({
        angle: invert(angle),
        height,
        period,
      }))

    const {
      speed,
      direction: { angle: windAngle },
    } = dataWind

    data.push({
      date: finalDate,
      spot,
      validSwells,
      wind: {
        speed: Number(speed) || 0,
        angle: invert(windAngle) || 0,
      },
      energy: Number(energyValue) || 0,
      source: 'general_7d',
    })
  })
  return data
}

const invert = (item: number) => (item > 180 ? item - 180 : item + 180)

export function getHourlyDate(date: DataDateType): number[] {
  const [, day, hour] = date.split(' ')
  const parsedDay = parseInt(day)
  const [, time, period] = /^(\d+)(AM|PM)$/.exec(hour)!
  const parsedTime = parseInt(time)

  if (period === 'AM') {
    return parsedTime === 12 ? [parsedDay, 0] : [parsedDay, parsedTime]
  }
  return parsedTime === 12 ? [parsedDay, 12] : [parsedDay, parsedTime + 12]
}

export function getGeneralDate(date: DataDateType): number[] {
  const timeOfDayMap: Record<string, number> = {
    mañana: 10,
    tarde: 16,
    noche: 22,
  }

  const [, day, timeOfDay] = date.split(' ')
  const parsedDay = parseInt(day)
  const hour = timeOfDayMap[timeOfDay] || 0
  return [parsedDay, hour]
}

export async function updateSurfForecast() {
  const startedAt = Date.now()
  let updatedSpots = 0
  const failedSpots: string[] = []

  for (const spot of spots) {
    await sleep(rand(2500, 8000))
    try {
      const hourlyHtml = await fetchSurfForecastHourly(spot)
      const generalHtml = await fetchSurfForecast7Days(spot)
      const newGeneralHtml = `<html><body><table>${generalHtml}</table></body></html>`
      const parsedGeneralData = await parseGeneralForecast(spot, newGeneralHtml)
      await SurfForecastModel.addMultipleForecast(parsedGeneralData)
      const newHourlyHtml = `<html><body><table>${hourlyHtml}</table></body></html>`
      const parsedHourlyData = await parseHourlyForecast(spot, newHourlyHtml)
      await SurfForecastModel.addMultipleForecast(parsedHourlyData)
      updatedSpots += 1
    } catch (err) {
      failedSpots.push(spot)
      if (err instanceof Error) {
        logger.error({ spot, err: err.message }, 'Error updating surf forecast')
      }
    }
  }

  logger.info(
    {
      updatedSpots,
      failedSpots,
      durationMs: Date.now() - startedAt,
    },
    'Surf forecast update finished',
  )
}
function madridToUtcDate(
  year: number,
  month0: number,
  day: number,
  hour: number,
): Date {
  return DateTime.fromObject(
    {
      year,
      month: month0 + 1,
      day,
      hour,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    { zone: 'Europe/Madrid' },
  )
    .toUTC()
    .toJSDate()
}

;(async () => {
  logger.info('Starting surf forecast update')
  await updateSurfForecast()
})()
