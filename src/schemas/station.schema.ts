import { z } from 'zod'

export const addStationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Station name is required'),
    station: z.string().min(1, 'Station ID is required'),
  }),
})

export type AddStationRequest = z.infer<typeof addStationSchema>
