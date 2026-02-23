import z from 'zod'

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
