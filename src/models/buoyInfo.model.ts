import { InferSchemaType, Schema, model } from 'mongoose'
import { NotFoundError } from '../errors/AppError'

const buoyInfoSchema = new Schema(
  {
    buoyId: { type: String, required: true, unique: true, index: true },
    buoyName: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    body: { type: String },
  },
  { collection: 'buoysInfo' },
)

buoyInfoSchema.index({ location: '2dsphere' })

export type BuoyInfoDoc = InferSchemaType<typeof buoyInfoSchema>

const BuoyInfo = model('BuoyInfo', buoyInfoSchema)

export class BuoyInfoModel {
  static async getAllBuoysInfo(): Promise<BuoyInfoDoc[]> {
    return BuoyInfo.find().select('-_id -__v').lean<BuoyInfoDoc[]>()
  }

  static async getBuoysInfoById(id: string): Promise<BuoyInfoDoc | null> {
    return BuoyInfo.findOne({ buoyId: id })
      .select('-_id -__v')
      .lean<BuoyInfoDoc | null>()
  }

  static async addBuoyInfo(buoyInfo: BuoyInfoDoc): Promise<void> {
    const newBuoyInfo = new BuoyInfo(buoyInfo)
    await newBuoyInfo.save()
  }

  static async deleteBuoysInfo(id?: string): Promise<void> {
    if (id) {
      const res = await BuoyInfo.deleteOne({ buoyId: id })
      if (res.deletedCount === 0) {
        throw new NotFoundError(`No buoy found with ID: ${id}`)
      }
    } else {
      await BuoyInfo.deleteMany({})
    }
  }
}
