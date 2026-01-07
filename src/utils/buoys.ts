import { BuoyFetch, DbBuoyRecord, formatedBuoys, id, value } from '../types.js'
import { BuoyModel } from '../models/buoy'
import buoys from '../buoyData.json'

interface buoyData {
  station: string
  body: string[] | string
  name?: string
}

async function fetchBuoys({
  station,
  body,
}: buoyData): Promise<BuoyFetch[] | void> {
  try {
    const response = await fetch(
      `https://portus.puertos.es/portussvr/api/RTData/station/${station}?locale=es`,
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
    return console.error(err)
  }
}

function formatValue(id: id, value: value): number {
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

function organizeData(data: BuoyFetch[]) {
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
    } as formatedBuoys
  })
}

const formatDate = (date: string): number => {
  const input = date

  const iso = input.replace(' ', 'T').replace('.0', '') + 'Z'

  const timestamp = Date.parse(iso)
  return timestamp
}

async function updateBuoysData({ station, body }: buoyData) {
  const data = await fetchBuoys({ station, body })

  if (!data) {
    return []
  }
  const formatedData = organizeData(data)

  return formatedData
}

export async function scheduledUpdate() {
  try {
    buoys.forEach(async ({ station, body, name }) => {
      console.log(`Fetching new Buoys for ${name}`)
      const newBuoys = await updateBuoysData({ station, body })
      await BuoyModel.addMultipleBuoys(station, newBuoys)
    })
    console.log('uploaded new Buoys')
  } catch (err) {
    console.error(err)
  }
}
