import { InferSchemaType, Schema, model } from 'mongoose'
import { FormattedBuoys } from '@myTypes/buoy.types'

const buoySchema = new Schema({
  station: { type: String, required: true },
  date: Date,
  period: Number,
  height: Number,
  avgDirection: Number,
  peakDirection: { type: Number, required: false },
})

buoySchema.index({ station: 1, date: -1 }, { unique: true })

export type BuoyDoc = InferSchemaType<typeof buoySchema>

const Buoy = model<BuoyDoc>('Buoy', buoySchema)

export interface BuoyParams {
  limit: number
  buoy?: string
}

function isDuplicateKeyError(err: unknown): err is { code: number } {
  if (typeof err !== 'object' || err === null) return false
  if (!('code' in err)) return false
  const e = err as { code: unknown }
  return typeof e.code === 'number' && e.code === 11000
}

export class BuoyModel {
  static async getBuoys({ limit, buoy }: BuoyParams) {
    try {
      const buoys: FormattedBuoys[] = await Buoy.find({ station: buoy })
        .sort({ date: -1 })
        .limit(limit)
        .select('-_id -__v')
      return buoys
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(
          `Couldn't get buoys from the database. Original error: ${err.message}`,
        )
      } else {
        throw new Error(
          "Couldn't get buoys from the database, and the error is not an instance of Error.",
        )
      }
    }
  }

  static async deleteBuoys() {
    try {
      await Buoy.deleteMany()
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

  static async getLastBuoy() {
    try {
      const lastBuoyData = await Buoy.findOne()
        .sort({ _id: -1 })
        .select('-_id -__v')
      if (!lastBuoyData) {
        throw new Error('No buoy data found')
      }
      return lastBuoyData
    } catch (err) {
      if (err instanceof Error) {
        throw new Error("Couldn't get last buoy data from the database")
      }
    }
  }

  static async addMultipleBuoys(buoys: FormattedBuoys[]) {
    if (!buoys.length) return

    const docs = buoys.map(
      ({ date, period, height, avgDirection, peakDirection, station }) => ({
        station,
        date: new Date(date),
        period,
        height,
        avgDirection,
        ...(peakDirection !== undefined && { peakDirection }),
      }),
    )

    try {
      await Buoy.insertMany(docs, { ordered: false })
    } catch (err: unknown) {
      if (isDuplicateKeyError(err)) {
        return
      }
      throw err
    }
  }
}
