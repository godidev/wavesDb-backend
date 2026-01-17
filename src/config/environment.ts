import { logger } from '@logger'

export interface Environment {
  PORT: number
  MONGO_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
}

export const loadEnvironment = (): Environment => {
  const { PORT = 3000, MONGO_URL, NODE_ENV = 'development' } = process.env

  if (!MONGO_URL && NODE_ENV !== 'test') {
    logger.error(
      'MONGO_URL is not defined. Please check your environment variables.',
    )
    process.exit(1)
  }

  return {
    PORT: parseInt(String(PORT), 10),
    MONGO_URL: MONGO_URL || '',
    NODE_ENV: NODE_ENV as 'development' | 'production' | 'test',
  }
}
