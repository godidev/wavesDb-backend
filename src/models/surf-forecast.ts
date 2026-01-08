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
  spot: { type: String, required: true },
  validSwells: { type: [SwellSchema], required: true, default: [] },
  wind: { type: WindSchema, required: true },
  energy: { type: Number, required: true },
})

SurfForecastSchema.index({ spot: 1, date: -1 }, { unique: true })

export type SurfForecastDoc = InferSchemaType<typeof SurfForecastSchema>

const SurfForecast = model<SurfForecastDoc>('SurfForecast', SurfForecastSchema)

export class SurfForecastModel {
  static async getSurfForecasts({
    spot,
    page,
    limit,
  }: {
    spot: string
    page: number
    limit: number
  }) {
    try {
      const forecast: WaveData[] = await SurfForecast.find({ spot })
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
      if (!forecast.length) return

      const ops = forecast.map((data) => ({
        updateOne: {
          filter: { spot: data.spot, date: data.date },
          update: { $set: data },
          upsert: true,
        },
      }))

      await SurfForecast.bulkWrite(ops, { ordered: false })
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(
          `Couldn't add multiple forecasts to the database: ${err.message}`,
        )
      }
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
