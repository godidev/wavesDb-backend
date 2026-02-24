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

const windObjectSchema = z.object({
  from: z.number().min(0).max(360),
  to: z.number().min(0).max(360),
})

const windRangeSchema = z.object({
  epic: z.array(windObjectSchema),
  limit: z.array(windObjectSchema),
  poor: z.array(windObjectSchema),
})

const periodObjectSchema = z.object({
  from: z.number().min(0).max(25),
  to: z.number().min(0).max(25),
})

const periodRangeSchema = z.object({
  epic: z.array(periodObjectSchema),
  limit: z.array(periodObjectSchema),
  poor: z.array(periodObjectSchema),
})

export const updateSpotInfoSchema = z.object({
  params: z.object({
    spotId: z.uuid('Invalid spot ID format'),
  }),
  body: z
    .object({
      active: z.boolean().optional(),
      location: z
        .object({
          type: z.enum(['Point']).optional(),
          coordinates: z.tuple([
            z.number().min(-180).max(180),
            z.number().min(-90).max(90),
          ]),
        })
        .optional(),
      optimalConditions: z
        .object({
          swellPeriod: periodRangeSchema.optional(),
          windDirection: windRangeSchema.optional(),
        })
        .refine(
          (data) =>
            data.swellPeriod !== undefined || data.windDirection !== undefined,
          {
            message:
              'At least one of swellPeriod or windDirection must be provided',
          },
        )
        .optional(),
    })
    .refine(
      (body) =>
        body.active !== undefined ||
        body.location !== undefined ||
        body.optimalConditions !== undefined,
      { message: 'At least one field must be provided for update' },
    ),
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
