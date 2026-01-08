import { Schema, model, InferSchemaType } from 'mongoose'
import { WaveData } from '../types'

const SwellSchema = new Schema(
  {
    period: { type: Number, required: true },
    angle: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
)

const WindSchema = new Schema(
  {
    speed: { type: Number, required: true },
    angle: { type: Number, required: true },
  },
  { _id: false },
)

export const SurfForecastSchema = new Schema({
  date: { type: Date, required: true },
  validSwells: { type: [SwellSchema], required: true, default: [] },
  wind: { type: WindSchema, required: true },
  energy: { type: Number, required: true },
})

SurfForecastSchema.index({ date: 1 }, { unique: true })

export type SurfForecastDoc = InferSchemaType<typeof SurfForecastSchema>

const SurfForecast = model<SurfForecastDoc>('SurfForecast', SurfForecastSchema)

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
