import pino from 'pino';

export const runningInDebugMode = false

export const logger = pino({
  level: runningInDebugMode ? "debug" : "info", browser: { asObject: true }
})
