import { InferSchemaType, Schema, model } from 'mongoose'

const buoyInfoSchema = new Schema(
  {
    buoyId: { type: String, required: true, unique: true, index: true },
    buoyName: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
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
  static async getAllBuoysInfo() {
    try {
      return await BuoyInfo.find().select('-_id -__v').lean<BuoyInfoDoc[]>()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Couldn't get buoys info from the database. Original error: ${msg}`,
      )
    }
  }

  static async getBuoysInfoById(id: string) {
    try {
      return await BuoyInfo.findOne({ buoyId: id })
        .select('-_id -__v')
        .lean<BuoyInfoDoc | null>()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Couldn't get buoy info by ID from the database. Original error: ${msg}`,
      )
    }
  }

  static async addBuoyInfo(buoyInfo: BuoyInfoDoc) {
    try {
      const newBuoyInfo = new BuoyInfo(buoyInfo)
      await newBuoyInfo.save()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Couldn't add buoy info to the database. Original error: ${msg}`,
      )
    }
  }

  static async deleteBuoysInfo(id?: string) {
    try {
      if (id) {
        const res = await BuoyInfo.deleteOne({ buoyId: id })
        if (res.deletedCount === 0) {
          throw new Error(`No buoy found with ID: ${id}`)
        }
      } else {
        await BuoyInfo.deleteMany({})
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Couldn't delete buoys info from the database. Original error: ${msg}`,
      )
    }
  }
}
