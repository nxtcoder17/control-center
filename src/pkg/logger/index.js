import pino from 'pino';

export const logger = pino({ browser: { asObject: true } })
