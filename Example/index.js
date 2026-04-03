import { startBot } from './src/app.js'
import logger from './src/utils/logger.js'

startBot().catch((err) => {
  logger.error(`[YebailExample] fatal error: ${err?.stack || err?.message || err}`)
  process.exit(1)
})
