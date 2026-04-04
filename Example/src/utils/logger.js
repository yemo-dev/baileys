import Color from './color.js'
import pino from 'pino'

const LOG_LEVELS = new Set(Object.keys(pino.levels.values))
const requestedLevel = (process.env.LOG_LEVEL || 'info').toLowerCase()
const safeLevel = LOG_LEVELS.has(requestedLevel) ? requestedLevel : 'info'
const internalLogLevel = safeLevel === 'debug' || safeLevel === 'trace' ? 'info' : safeLevel

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
