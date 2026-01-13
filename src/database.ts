import mongoose, { Connection } from 'mongoose'
import { logger } from '@logger'

export const connectToDatabase = async (
  mongoUrl: string,
): Promise<Connection> => {
  try {
    const connection = await mongoose.connect(mongoUrl, {
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 5000,
    })

    return connection.connection
  } catch (err) {
    logger.error({ err }, 'Error connecting to MongoDB')
    throw err
  }
}
