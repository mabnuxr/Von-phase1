// Environment configuration with type safety

interface EnvConfig {
  APP_ENV: 'development' | 'staging' | 'production';
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_DEBUG: boolean;
  ENABLE_ANALYTICS: boolean;
  BUILD_VERSION: string;
  BUILD_TIMESTAMP: string;
  SENTRY_DSN?: string;
  GA_TRACKING_ID?: string;
}

const getEnvVar = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvBool = (key: string, defaultValue = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const env: EnvConfig = {
  APP_ENV: getEnvVar('VITE_APP_ENV', 'development') as EnvConfig['APP_ENV'],
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
  API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
  ENABLE_DEBUG: getEnvBool('VITE_ENABLE_DEBUG', true),
  ENABLE_ANALYTICS: getEnvBool('VITE_ENABLE_ANALYTICS', false),
  BUILD_VERSION: getEnvVar('VITE_BUILD_VERSION', 'local'),
  BUILD_TIMESTAMP: getEnvVar('VITE_BUILD_TIMESTAMP', new Date().toISOString()),
  SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN'),
  GA_TRACKING_ID: getEnvVar('VITE_GA_TRACKING_ID'),
};

// Helper functions
export const isDevelopment = (): boolean => env.APP_ENV === 'development';
export const isStaging = (): boolean => env.APP_ENV === 'staging';
export const isProduction = (): boolean => env.APP_ENV === 'production';

// Logger that respects environment settings
export const logger = {
  log: (...args: unknown[]): void => {
    if (env.ENABLE_DEBUG) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
    // In production, could send to error tracking service
    if (env.SENTRY_DSN && isProduction()) {
      // Sentry.captureException(args[0]);
    }
  },
  warn: (...args: unknown[]): void => {
    if (env.ENABLE_DEBUG) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (env.ENABLE_DEBUG) {
      console.info(...args);
    }
  },
};

export default env;
