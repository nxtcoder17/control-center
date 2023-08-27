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

function mergeKVs(kvs: KV[]): Record<string, any> {
  return kvs.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
}

export function newLogger(level: LogLevel): Logger {
  const logger = pino({
    level,
    // browser: { asObject: true },
    timestamp: false,
    browser: {
      write: {
        info: (o: any) => {
          const { msg, level, ...rest } = o
          console.info(msg, rest)
        },
        warn: (o: any) => {
          const { msg, level, ...rest } = o
          console.warn(msg, rest)
        },
        error: (o: any) => {
          const { msg, level, ...rest } = o
          console.error(msg, rest)
        },
        log: (o: any) => {
          const { msg, level, ...rest } = o
          console.log(msg, rest)
        },
        debug: (o: any) => {
          const { msg, level, ...rest } = o
          console.debug(msg, rest)
        },
      },
    },
  })
  return {
    debug: (msg: string, ...kv: KV[]) => { logger.debug(mergeKVs(kv), msg) },
    info: (msg: string, ...kv: KV[]) => { logger.info(mergeKVs(kv), msg) },
    warn: (msg: string, ...kv: KV[]) => { logger.warn(mergeKVs(kv), msg) },
    error: (err: Error, msg?: string) => { logger.error(err, msg) },
  }
}
