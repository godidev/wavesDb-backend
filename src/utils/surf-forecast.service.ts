import { DateTime } from 'luxon'
import * as cheerio from 'cheerio'
import { SurfForecastModel } from '@models/surf-forecast.model'
import { DataSwellState, WaveData } from '@myTypes/surf-forecast.types'
import spots from '@data/surf-forecast/basque-country-surf-spots.json'
import { logger } from '@logger'

async function fetchSurfForecast(beach: string): Promise<string> {
  const url = `https://es.surf-forecast.com/breaks/${beach}/forecasts/data?parts=basic&period_types=h&forecast_duration=48h`

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9,es;q=0.8',
      cookie: 'last_loc=3580; ',
      '^if-none-match': 'W/^^26736cd3943005b5e3c01a6cf13a8798^^^',
      priority: 'u=1, i',
      referer: `https://es.surf-forecast.com/breaks/${beach}/forecasts/latest`,
      '^sec-ch-ua': '^^Google',
      'sec-ch-ua-mobile': '?0',
      '^sec-ch-ua-platform': '^^Windows^^^',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'x-csrf-token':
        'fX2oQTDp4Y0cUt8YM8H3V/eKNP1X/Iy2MTOyPLACKmiTLblSBmy78AVmz3xoOB8tbPTyybzKlr1nn6sYZs5teg==',
    },
  }
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return data.period_types.h.parts.basic.content
  } catch {
    throw new Error('Error fetching surf forecast')
  }
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
        speed: invert(speed),
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export async function updateSurfForecast() {
  for (const spot of spots) {
    await sleep(rand(2500, 8000))
    try {
      const html = await fetchSurfForecast(spot)
      const newHtml = `<html><body><table>${html}</table></body></html>`
      const parsedData = await parseForecast(spot, newHtml)
      await SurfForecastModel.addMultipleForecast(parsedData)
      logger.info({ spot }, 'Updated surf forecast')
    } catch (err) {
      if (err instanceof Error) {
        logger.error({ spot, err: err.message }, 'Error updating surf forecast')
      }
    }
  }
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
