export type validSwells = Omit<DataSwell, 'letters'>[]

export interface WaveData {
  date: Date
  spot: string
  validSwells: validSwells
  wind: {
    speed: number
    angle: number
  }
  energy: number
  source: 'general_7d' | 'hourly_48h'
}

type DataSwell = {
  period: number
  angle: number
  letters: string
  height: number
}

export type DataSwellItem = DataSwell | null

export type DataSwellStateType = DataSwellItem[]

export interface ResponseHourly {
  period_types?: { p: { parts: { basic: { content: string } } } }
}

export interface ResponseDaily {
  period_types?: { h: { parts: { basic: { content: string } } } }
}

export type DataWindStateType = {
  direction: {
    angle: number
    letters: string
  }
  speed: number
}

export type DataDateType = string

export type DataSwellEnergyType = {
  value: number
  colors: {
    background: string
    text: string
  }
}[]
