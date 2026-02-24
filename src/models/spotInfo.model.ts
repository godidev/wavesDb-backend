import { InferSchemaType, Schema, model } from 'mongoose'
import { NotFoundError } from '../errors/AppError'
import { randomUUID } from 'node:crypto'
import { AddSpotInfoBody, UpdateSpotInfoBody } from '@schemas/spot.schema'

const windRangeSchema = new Schema(
  {
    from: { type: Number, required: true, min: 0, max: 360 },
    to: { type: Number, required: true, min: 0, max: 360 },
  },
  { _id: false },
)

const periodRangeSchema = new Schema(
  {
    from: { type: Number, required: true, min: 0, max: 25 },
    to: { type: Number, required: true, min: 0, max: 25 },
  },
  { _id: false },
)

const spotInfoSchema = new Schema(
  {
    spotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => randomUUID(),
    },
    spotName: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    active: { type: Boolean, default: false },
    spotUrlName: { type: String, required: true, unique: true },
    optimalConditions: {
      swellPeriod: {
        epic: { type: [periodRangeSchema], required: true },
        limit: { type: [periodRangeSchema], required: true },
        poor: { type: [periodRangeSchema], required: true },
      },
      windDirection: {
        epic: { type: [windRangeSchema], required: true },
        limit: { type: [windRangeSchema], required: true },
        poor: { type: [windRangeSchema], required: true },
      },
    },
  },
  { collection: 'spotsInfo' },
)

spotInfoSchema.index({ location: '2dsphere', spotUrlName: 1 })

export type SpotInfoDoc = InferSchemaType<typeof spotInfoSchema>

const SpotInfo = model('SpotInfo', spotInfoSchema)

export class SpotInfoModel {
  static async getAllSpotsInfo(): Promise<SpotInfoDoc[]> {
    return SpotInfo.find().select('-_id -__v').lean<SpotInfoDoc[]>()
  }

  static async updateSpotInfo(
    spotId: string,
    updateData: UpdateSpotInfoBody,
  ): Promise<void> {
    if (!spotId) {
      throw new Error('spotId is required for updating spot info')
    }

    const res = await SpotInfo.updateOne({ spotId }, updateData)
    if (res.matchedCount === 0) {
      throw new NotFoundError(`No spot found with ID: ${spotId}`)
    }
  }

  static async addSpotInfo(spotInfo: AddSpotInfoBody): Promise<void> {
    const newSpotInfo = new SpotInfo(spotInfo)
    await newSpotInfo.save()
  }

  static async deleteSpotsInfo(id?: string): Promise<void> {
    if (id) {
      const res = await SpotInfo.deleteOne({ spotId: id })
      if (res.deletedCount === 0) {
        throw new NotFoundError(`No spot found with ID: ${id}`)
      }
    } else {
      await SpotInfo.deleteMany({})
    }
  }
}
