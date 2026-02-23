import { InferSchemaType, Schema, model } from 'mongoose'
import { NotFoundError } from '../errors/AppError'
import { randomUUID } from 'node:crypto'
import { AddSpotInfoBody } from '@schemas/spot.schema'

const spotInfoSchema = new Schema(
  {
    spotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => randomUUID(),
    },
    spotName: { type: String, required: true, unique: true },
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
  },
  { collection: 'spotsInfo' },
)

spotInfoSchema.index({ location: '2dsphere', spotName: 1 })

export type SpotInfoDoc = InferSchemaType<typeof spotInfoSchema>

const SpotInfo = model('SpotInfo', spotInfoSchema)

export class SpotInfoModel {
  static async getAllSpotsInfo(): Promise<SpotInfoDoc[]> {
    return SpotInfo.find().select('-_id -__v').lean<SpotInfoDoc[]>()
  }

  static async updateSpotInfo(
    spotId: string,
    active: boolean,
    coordinates?: [number, number],
  ): Promise<void> {
    const updateData: Partial<SpotInfoDoc> = { active }
    if (coordinates) {
      updateData.location = { type: 'Point', coordinates }
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
