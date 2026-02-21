import { DateTime } from 'luxon'
import * as cheerio from 'cheerio'
import { SurfForecastModel } from '@models/surf-forecast.model'
import { DataSwellState, WaveData } from '@myTypes/surf-forecast.types'
import spots from '@data/surf-forecast/surf-spots.json'
import { logger } from '@logger'

const SURF_FORECAST_TIMEOUT_MS = 12000
const SURF_FORECAST_MAX_RETRIES = 3

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const getBackoffDelay = (attempt: number) => 750 * 2 ** (attempt - 1)

async function fetchSurfForecast(beach: string): Promise<string> {
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

      const data = (await response.json()) as {
        period_types?: {
          h?: {
            parts?: {
              basic?: {
                content?: string
              }
            }
          }
        }
      }

      const content = data.period_types?.h?.parts?.basic?.content
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

export async function parseForecast(spot: string, html: string) {
  const now = new Date()
  let month = now.getMonth()
  let year = now.getFullYear()
  let lastSeenDay = 0

  const convertDate = ({ day, hour }: { day: number; hour: number }) => {
    if (day < lastSeenDay) {
      if (month++ > 11) {
        month = 0
        year++
      }
    }
    lastSeenDay = day

    return madridToUtcDate(year, month, day, hour)
  }

  const $ = cheerio.load(html)

  const waves = $('td.forecast-table__cell.forecast-table-wave-graph__cell')
  const energy = $(
    'td.forecast-table__cell.forecast-table-energy__cell > strong',
  )

  const data: WaveData[] = []

  waves.each((index, element) => {
    const waveElement = $(element)
    const dataDate = waveElement.attr('data-date')
    const dataSwellState = JSON.parse(
      waveElement.attr('data-swell-state') as string,
    ) as DataSwellState
    const dataWind = JSON.parse(waveElement.attr('data-wind') as string)

    const [day, hour] = getDate(dataDate as string)
    const finalDate = convertDate({ day, hour })

    const energyElement = energy.get(index)
    const energyValue = energyElement ? $(energyElement).text() : ''

    const swells = dataSwellState.filter((item) => item !== null)

    const validSwells = swells.map(({ period, angle, height }) => ({
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
        speed: Number(speed),
        angle: invert(windAngle),
      },
      energy: Number(energyValue),
    })
  })
  return data
}

const invert = (item: number) => (item > 180 ? item - 180 : item + 180)

export function getDate(date: string): number[] {
  const [, day, hour] = date.split(' ')
  const parsedDay = parseInt(day)
  const [, time, period] = /^(\d+)(AM|PM)$/.exec(hour)!
  const parsedTime = parseInt(time)

  if (period === 'AM') {
    return parsedTime === 12 ? [parsedDay, 0] : [parsedDay, parsedTime]
  }
  return parsedTime === 12 ? [parsedDay, 12] : [parsedDay, parsedTime + 12]
}

export async function updateSurfForecast() {
  const startedAt = Date.now()
  let updatedSpots = 0
  const failedSpots: string[] = []

  for (const spot of spots) {
    await sleep(rand(2500, 8000))
    try {
      const html = await fetchSurfForecast(spot)
      const newHtml = `<html><body><table>${html}</table></body></html>`
      const parsedData = await parseForecast(spot, newHtml)
      await SurfForecastModel.addMultipleForecast(parsedData)
      updatedSpots += 1
      logger.info({ spot, records: parsedData.length }, 'Updated surf forecast')
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
