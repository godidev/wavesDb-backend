import { z } from 'zod'

export const buoyIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Buoy ID is required'),
  }),
})

export const buoyLimitSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Buoy ID is required'),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(6),
  }),
})

export const buoyNearSchema = z.object({
  query: z.object({
    longitude: z.coerce.number().min(-180).max(180, 'Invalid longitude'),
    latitude: z.coerce.number().min(-90).max(90, 'Invalid latitude'),
    maxDistanceKm: z.coerce
      .number()
      .positive('maxDistanceKm must be a positive number')
      .max(1000, 'maxDistanceKm must be less than or equal to 1000')
      .default(10),
  }),
})

export const addBuoySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Buoy ID is required'),
  }),
  body: z.object({
    buoyName: z.string().min(1, 'buoyName is required'),
    location: z.object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ]),
    }),
    body: z.string().optional(),
  }),
})

export type BuoyIdParams = z.infer<typeof buoyIdSchema>
export type BuoyLimitQuery = z.infer<typeof buoyLimitSchema>
export type AddBuoyRequest = z.infer<typeof addBuoySchema>
