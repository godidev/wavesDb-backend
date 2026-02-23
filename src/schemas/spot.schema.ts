import z from 'zod'

export const addSpotInfoSchema = z.object({
  body: z.object({
    spotId: z.uuid('Invalid spot ID format').optional(),
    spotName: z.string().min(1, 'Spot name is required'),
    spotUrlName: z.string().min(1, 'Spot URL name is required'),
    location: z.object({
      type: z.enum(['Point']).optional(),
      coordinates: z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ]),
    }),
    active: z.boolean().optional(),
  }),
})

export const updateSpotInfoSchema = z.object({
  params: z.object({
    spotId: z.uuid('Invalid spot ID format'),
  }),
  body: z.object({
    active: z.boolean(),
    coordinates: z
      .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
      .optional(),
  }),
})

export const deleteSpotInfoSchema = z.object({
  body: z.object({
    spotId: z.uuid().optional(),
  }),
})

export type UpdateSpotInfoBody = z.infer<typeof updateSpotInfoSchema>['body']
export type UpdateSpotInfoParams = z.infer<
  typeof updateSpotInfoSchema
>['params']
export type DeleteSpotInfoBody = z.infer<typeof deleteSpotInfoSchema>['body']

export type AddSpotInfoBody = z.infer<typeof addSpotInfoSchema>['body']
