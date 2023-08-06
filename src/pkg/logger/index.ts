import pino from 'pino'
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
}

export interface Logger {
  debug: (msg: string, ...kv: KV[]) => void
  info: (msg: string, ...kv: KV[]) => void
  warn: (msg: string, ...kv: KV[]) => void
  error: (err: Error, msg?: string) => void
}

type KV = Record<string, any>

function mergeKVs (kvs: KV[]): Record<string, any> {
  return kvs.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
}

export function newLogger (level: LogLevel): Logger {
  const logger = pino({ level, browser: { asObject: true } })
  return {
    debug: (msg: string, ...kv: KV[]) => { logger.debug(mergeKVs(kv), msg) },
    info: (msg: string, ...kv: KV[]) => { logger.info(mergeKVs(kv), msg) },
    warn: (msg: string, ...kv: KV[]) => { logger.warn(mergeKVs(kv), msg) },
    error: (err: Error, msg?: string) => { logger.error(err, msg) },
  }
}
