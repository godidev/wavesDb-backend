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
  buoyId?: string
}

function isDuplicateKeyError(err: unknown): err is { code: number } {
  if (typeof err !== 'object' || err === null) return false
  if (!('code' in err)) return false
  const e = err as { code: unknown }
  return typeof e.code === 'number' && e.code === 11000
}

export class BuoyDataModel {
  static async getBuoys({
    limit,
    buoyId,
  }: BuoyParams): Promise<FormattedBuoys[]> {
    return BuoyData.find({ buoyId })
      .sort({ date: -1 })
      .limit(limit)
      .select('-_id -__v')
      .lean<FormattedBuoys[]>()
      .then((docs) =>
        docs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      )
  }

  static async deleteBuoyData(): Promise<void> {
    await BuoyData.deleteMany()
  }

  static async getLastBuoy(): Promise<BuoyDataDoc | null> {
    return BuoyData.findOne().sort({ _id: -1 }).select('-_id -__v').lean()
  }

  static async addMultipleBuoys(buoys: FormattedBuoys[]): Promise<void> {
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
      if (!isDuplicateKeyError(err)) {
        throw err
      }
    }
  }
}
