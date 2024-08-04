import { type Logger } from './pkg/logger'

declare global {
	// eslint-disable-next-line no-var
	var logger: Logger
}
