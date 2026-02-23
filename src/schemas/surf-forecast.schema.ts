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

export type SurfForecastSpotParams = z.infer<typeof surfForecastSpotSchema>
