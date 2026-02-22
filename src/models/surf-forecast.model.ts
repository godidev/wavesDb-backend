import { Schema, model, InferSchemaType } from 'mongoose'
import { WaveData } from '@myTypes/surf-forecast.types'

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
  source: {
    type: String,
    enum: ['general_7d', 'hourly_48h'],
    required: true,
  },
})

SurfForecastSchema.index({ spot: 1, date: -1, source: 1 }, { unique: true })

export type SurfForecastDoc = InferSchemaType<typeof SurfForecastSchema>

const SurfForecast = model<SurfForecastDoc>('SurfForecast', SurfForecastSchema)

export class SurfForecastModel {
  static async getAllSpots() {
    try {
      const spots = await SurfForecast.distinct('spot')
      return spots
    } catch {
      throw new Error("Couldn't get spots from the database")
    }
  }

  static async getSurfForecasts({
    spot,
    page,
    limit,
    hoursBeforeNow = 3,
    source,
  }: {
    spot: string
    page: number
    limit: number
    hoursBeforeNow?: number
    source: 'general_7d' | 'hourly_48h'
  }) {
    hoursBeforeNow = source === 'hourly_48h' ? hoursBeforeNow : 12
    try {
      const forecast: WaveData[] = await SurfForecast.find({
        spot,
        date: { $gte: new Date(Date.now() - hoursBeforeNow * 60 * 60 * 1000) },
        source,
      })
        .sort({ date: 1 })
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
          filter: { spot: data.spot, date: data.date, source: data.source },
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
          `Couldn't delete surf forecasts from the database. Original error: ${err.message}`,
        )
      } else {
        throw new Error(
          "Couldn't delete surf forecasts from the database, and the error is not an instance of Error.",
        )
      }
    }
  }
}
