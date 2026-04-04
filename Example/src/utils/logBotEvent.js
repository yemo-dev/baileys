import Color from './color.js'
import logger from './logger.js'

export const logBotEvent = async (label, fn) => {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = (performance.now() - start).toFixed(2)
    logger.info(`${Color.bold(label)} ${Color.green('ok')} ${Color.dim(`${duration}ms`)}`)
    return result
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2)
    logger.error(`${Color.bold(label)} ${Color.red('error')} ${Color.dim(`${duration}ms`)} ${Color.gray(err?.message || 'unknown')}`)
    throw err
  }
}

export const logIncoming = ({ jid, text }) => {
  logger.info(`${Color.cyan('[IN]')} ${Color.gray(jid)} ${Color.bold(text)}`)
}

export const logConnection = ({ connection }) => {
  logger.info(`${Color.yellow('[CONNECTION]')} ${Color.bold(connection || 'unknown')}`)
}
