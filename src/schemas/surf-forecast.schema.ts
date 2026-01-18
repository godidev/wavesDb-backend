import { z } from 'zod'

export const surfForecastSpotSchema = z.object({
  params: z.object({
    spot: z.string().min(1, 'Spot name is required'),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  }),
})

export type SurfForecastSpotParams = z.infer<typeof surfForecastSpotSchema>
