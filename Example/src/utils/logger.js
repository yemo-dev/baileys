import Color from './color.js'
import pino from 'pino'

const LOG_LEVELS = new Set([...Object.keys(pino.levels.values), 'silent'])
const RESTRICTED_LEVELS = new Set(['debug', 'trace'])
const requestedLevel = (
  process.env.WA_CONNECTION_LOG_LEVEL
  || process.env.INTERNAL_LOG_LEVEL
  || process.env.LOG_LEVEL
  || 'silent'
).toLowerCase()
const sanitizedLevel = LOG_LEVELS.has(requestedLevel) ? requestedLevel : 'silent'
const internalLogLevel = RESTRICTED_LEVELS.has(sanitizedLevel) ? 'info' : sanitizedLevel

export const internalLogger = pino({
  level: internalLogLevel,
})

const logger = {
  info: (msg) => console.log(`${Color.blue('○')} ${Color.gray('info')} ${msg}`),
  ready: (msg) => console.log(`${Color.green('●')} ${Color.gray('ready')} ${msg}`),
  warn: (msg) => console.log(`${Color.yellow('○')} ${Color.gray('warn')} ${msg}`),
  error: (msg) => console.error(`${Color.red('●')} ${Color.gray('error')} ${msg}`),
}

export default logger
