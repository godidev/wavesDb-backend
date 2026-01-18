export type ID = 34 | 13 | 20 | 21 | 32

export interface BuoyFetch {
  fecha: string
  datos: BuoyFetchData[]
}

export interface BuoyFetchData {
  id: ID
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

export type FormattedBuoys = {
  date: number
  buoyId: string
  period: number
  height: number
  avgDirection: number
  peakDirection?: number
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

export interface BuoyQuery {
  limit: number
  buoyId: string
}

export interface BuoyResponse {
  buoys: FormattedBuoys[]
}
