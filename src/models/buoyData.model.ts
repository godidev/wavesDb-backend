import { InferSchemaType, Schema, model } from 'mongoose'
import { FormattedBuoys } from '@myTypes/buoy.types'

const buoyDataSchema = new Schema(
  {
    buoyId: { type: String, required: true },
    date: { type: Date, required: true },
    period: { type: Number, required: true },
    height: { type: Number, required: true },
    avgDirection: { type: Number, required: true },
    peakDirection: { type: Number, required: false },
  },
  { collection: 'buoysData' },
)

buoyDataSchema.index({ buoyId: 1, date: -1 }, { unique: true })

export type BuoyDataDoc = InferSchemaType<typeof buoyDataSchema>

const BuoyData = model<BuoyDataDoc>('BuoyData', buoyDataSchema)
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

export class BuoyDataModel {
  static async getBuoys({ limit, buoy }: BuoyParams) {
    try {
      const buoys: FormattedBuoys[] = await BuoyData.find({ buoyId: buoy })
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

  static async getBuoyById({ id, limit }: { id: string; limit?: number }) {
    try {
      const buoyData = await BuoyData.find({ buoyId: id })
        .sort({ date: -1 })
        .limit(limit || 6)
        .select('-_id -__v')
      return buoyData
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(
          `Couldn't get buoy by ID from the database. Original error: ${err.message}`,
        )
      } else {
        throw new Error(
          "Couldn't get buoy by ID from the database, and the error is not an instance of Error.",
        )
      }
    }
  }

  static async deleteBuoyData() {
    try {
      await BuoyData.deleteMany()
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
      const lastBuoyData = await BuoyData.findOne()
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
      ({ date, period, height, avgDirection, peakDirection, buoyId }) => ({
        buoyId,
        date: new Date(date),
        period,
        height,
        avgDirection,
        ...(peakDirection !== undefined && { peakDirection }),
      }),
    )

    try {
      await BuoyData.insertMany(docs, { ordered: false })
    } catch (err: unknown) {
      if (isDuplicateKeyError(err)) {
        return
      }
      throw err
    }
  }
}
