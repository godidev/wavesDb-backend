type id = 34 | 13 | 20 | 21 | 32
type value = Pick<fetchData, 'valor'>['valor']

export interface BuoyFetch {
  fecha: string
  datos: buoyFetchDatos[]
}

export interface buoyFetchDatos {
  id: id
  nombreParametro: string
  nombreColumna: string
  paramEseoo: string
  valor: string
  factor: number
  unidad: string
  paramQC: boolean
  variable: string
  averia: boolean
}

type formatedBuoys = {
  date: number
  station: string
  period: number
  height: number
  avgDirection: number
  peakDirection?: number
}

export interface station {
  name: string
  station: string
}

export interface DbBuoyRecord {
  date: string
  datos: {
    'Periodo de Pico': number
    'Altura Signif. del Oleaje': number
    'Direcc. Media de Proced.': number
    'Direcc. de pico de proced.'?: number
  }
}

export type validSwells = Omit<DataSwell, 'letters'>[]

export interface WaveData {
  date: Date
  validSwells: validSwells
  wind: {
    speed: number
    angle: number
  }
  energy: number
}

type DataSwell = {
  period: number
  angle: number
  letters: string
  height: number
}

export type DataSwellItem = DataSwell | null

export type DataSwellState = DataSwellItem[]
