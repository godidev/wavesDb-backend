import { logger } from '@logger'

export interface Environment {
  PORT: number
  MONGO_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
  ALLOWED_ORIGINS: string[]
  SCRAPE_API_KEY: string
}

const parseAllowedOrigins = (value?: string): string[] => {
  if (!value) return []
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const loadEnvironment = (): Environment => {
  const {
    PORT = 3000,
    MONGO_URL,
    NODE_ENV = 'development',
    ALLOWED_ORIGINS,
    SCRAPE_API_KEY = '',
  } = process.env

  if (!MONGO_URL && NODE_ENV !== 'test') {
    logger.error(
      'MONGO_URL is not defined. Please check your environment variables.',
    )
    process.exit(1)
  }

  const allowedOrigins = parseAllowedOrigins(ALLOWED_ORIGINS)

  return {
    PORT: parseInt(String(PORT), 10),
    MONGO_URL: MONGO_URL || '',
    NODE_ENV: NODE_ENV as 'development' | 'production' | 'test',
    ALLOWED_ORIGINS: allowedOrigins,
    SCRAPE_API_KEY,
  }
}
