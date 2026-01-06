import { Schema, model } from 'mongoose'
import { WaveData } from '../types'

const SurfForecastSchema = new Schema({
  date: Date,
  height: Number,
  period: Number,
  waveDirection: Number,
  windSpeed: Number,
  windAngle: Number,
  windLetters: String,
  energy: String,
})

const SurfForecast = model('SurfForecast', SurfForecastSchema)

export class SurfForecastModel {
  static async getSurfForecasts({
    page,
    limit,
  }: {
    page: number
    limit: number
  }) {
    try {
      const forecast: WaveData[] = await SurfForecast.find()
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v -_id')
      return forecast
    } catch {
      throw new Error("Couldn't get forecasts from the database")
    }
  }

  static async getLastForecast() {
    try {
      const lastData: WaveData | null = await SurfForecast.findOne()
        .sort({ date: -1 })
        .select('-_id -__v')
      return lastData
    } catch {
      throw new Error("Couldn't get last forecast data from the database")
    }
  }

  static async addMultipleForecast(forecast: WaveData[]) {
    try {
      forecast.forEach(async (data) => {
        const { date } = data
        await SurfForecast.findOneAndUpdate(
          {
            date,
          },
          data,
          {
            upsert: true,
          },
        )
      })
    } catch {
      throw new Error("Couldn't add multiple forecasts to the database")
    }
  }

  static async deleteSurfForecast() {
    try {
      await SurfForecast.deleteMany()
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(
          `Couldn't delete buoys from the database. Original error: ${err.message}`,
        )
      } else {
        throw new Error(
          "Couldn't delete buoys from the database, and the error is not an instance of Error.",
        )
      }
    }
  }
}
