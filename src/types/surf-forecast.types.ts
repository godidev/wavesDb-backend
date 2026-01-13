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
}

type DataSwell = {
  period: number
  angle: number
  letters: string
  height: number
}

export type DataSwellItem = DataSwell | null

export type DataSwellState = DataSwellItem[]
