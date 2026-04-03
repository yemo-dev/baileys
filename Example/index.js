import { startBot } from './src/app.js'

startBot().catch((err) => {
  console.error('[YebailExample] fatal error:', err)
  process.exit(1)
})
