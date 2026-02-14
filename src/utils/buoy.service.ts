import {
  BuoyFetch,
  DbBuoyRecord,
  FormattedBuoys,
  ID,
} from '@myTypes/buoy.types'
import { BuoyDataModel } from '@models/buoyData.model'
import { logger } from '@logger'
import { BuoyInfoModel } from '@models/buoyInfo.model'

interface buoyData {
  buoyId: string
  body: string
  name?: string
}

async function fetchBuoys({
  buoyId,
  body,
}: buoyData): Promise<BuoyFetch[] | void> {
  try {
    const response = await fetch(
      `https://portus.puertos.es/portussvr/api/RTData/station/${buoyId}?locale=es`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9,es;q=0.8',
          'content-type': 'application/json;charset=UTF-8',
          Referer: 'https://portus.puertos.es/',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: `${body}`,
        method: 'POST',
      },
    )
    const res = await response.json()
    return res as BuoyFetch[]
  } catch (err) {
    return logger.error(
      `Error fetching buoy data for station ${buoyId}: ${err}`,
    )
  }
}

export function formatValue(id: ID, value: string): number {
  switch (id) {
    case 34:
    case 13:
    case 32:
      return Number(value) / 100
    case 20:
    case 21:
      return Number(value)
    default:
      return 0
  }
}

export function organizeData(data: BuoyFetch[]) {
  return data.map(({ fecha, datos }) => {
    const formattedData: DbBuoyRecord['datos'] = {
      'Periodo de Pico': 0,
      'Altura Signif. del Oleaje': 0,
      'Direcc. Media de Proced.': 0,
      'Direcc. de pico de proced.': 0,
    }

    datos.forEach(({ id, valor, nombreParametro }) => {
      const formattedValue = formatValue(id, valor)
      if (Object.keys(formattedData).includes(nombreParametro)) {
        formattedData[nombreParametro as keyof typeof formattedData] =
          formattedValue
      }
    })

    const peak = formattedData['Direcc. de pico de proced.']

    return {
      date: formatDate(fecha),
      period: formattedData['Periodo de Pico'],
      height: formattedData['Altura Signif. del Oleaje'],
      avgDirection: formattedData['Direcc. Media de Proced.'],
      ...(peak !== 0 && { peakDirection: peak }),
    }
  })
}

export const formatDate = (date: string): number => {
  const input = date

  const iso = input.replace(' ', 'T').replace('.0', '') + 'Z'

  const timestamp = Date.parse(iso)
  return timestamp
}

export async function updateBuoysData({
  buoyId,
  body,
}: buoyData): Promise<FormattedBuoys[]> {
  const data = await fetchBuoys({ buoyId, body })

  if (!data) {
    return []
  }
  const formatedData = organizeData(data)

  return formatedData.map((item) => ({ buoyId, ...item }))
}

export async function scheduledUpdate() {
  const startedAt = Date.now()
  let updatedBuoys = 0
  const failedBuoys: string[] = []

  try {
    const buoys = await BuoyInfoModel.getAllBuoysInfo()

    if (!Array.isArray(buoys) || buoys.length === 0) {
      logger.warn('No buoys found to update')
      return
    }

    for (const { buoyId, body, buoyName } of buoys) {
      try {
        logger.info(`Fetching new Buoys for ${buoyName} (${buoyId})`)

        if (!body) {
          logger.warn(`No body found for buoy ${buoyName} (${buoyId})`)
          continue
        }

        const newBuoys = await updateBuoysData({ buoyId, body })
        await BuoyDataModel.addMultipleBuoys(newBuoys)
        updatedBuoys += 1

        logger.info({ buoyId, records: newBuoys.length }, 'Updated buoy data')
      } catch (err) {
        failedBuoys.push(buoyId)
        const message = err instanceof Error ? err.message : String(err)
        logger.error(`Failed to update buoy ${buoyId}: ${message}`)
      }
    }

    logger.info(
      {
        updatedBuoys,
        failedBuoys,
        durationMs: Date.now() - startedAt,
      },
      'Scheduled buoy update completed',
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Error during scheduled buoy update: ${message}`)
  }
}
