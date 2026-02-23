import { z } from 'zod'

export const surfForecastSpotSchema = z.object({
  params: z.object({
    spotId: z.uuid('Invalid spot ID format'),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  }),
})

export const addSpotInfoSchema = z.object({
  body: z.object({
    spotName: z.string().min(1, 'Spot name is required'),
    location: z.object({
      type: z.enum(['Point']).optional(),
      coordinates: z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ]),
    }),
  }),
})

export type SurfForecastSpotParams = z.infer<typeof surfForecastSpotSchema>
export type AddSpotInfoBody = z.infer<typeof addSpotInfoSchema>['body']
