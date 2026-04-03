import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { Boom } from '@hapi/boom'
import { NodeCache } from '@cacheable/node-cache'
import yebail, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  makeInMemoryStore,
  getContentType,
  getAggregateVotesInPollMessage,
} from '@yemo-dev/yebail'
import logger, { internalLogger } from './utils/logger.js'
import { ask } from './utils/helpers.js'
import { logBotEvent, logConnection, logIncoming } from './utils/logBotEvent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.resolve(ROOT, 'plugins')
const makeWASocket = yebail.makeWASocket || yebail.default || yebail

const loadPlugins = async (pluginsDir) => {
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => e.name)
    .sort()

  const plugins = []
  for (const file of files) {
    const fullPath = path.join(pluginsDir, file)
    const mod = await import(pathToFileURL(fullPath).href)
    const plugin = mod.default
    if (!plugin?.name || !Array.isArray(plugin?.commands) || typeof plugin?.execute !== 'function') continue
    plugins.push(plugin)
  }
  return plugins
}

const store = makeInMemoryStore({ logger: internalLogger })
const storePath = path.resolve(ROOT, 'yebail_store.json')
store.readFromFile(storePath)
setInterval(() => store.writeToFile(storePath), 10_000)

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const getMessageText = (msg) => {
  const content = msg?.message
  if (!content) return ''
  const type = getContentType(content)
  if (!type) return ''
  return content[type]?.text || content[type]?.caption || content?.conversation || ''
}

export const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(path.resolve(ROOT, 'sessions'))
  const { version, isLatest } = await fetchLatestWaWebVersion()
  logger.info(`[Yebail] WA v${version.join('.')} latest=${isLatest}`)

  const plugins = await loadPlugins(PLUGINS_DIR)
  const commandMap = new Map()
  for (const plugin of plugins) {
    for (const command of plugin.commands) commandMap.set(command, plugin)
  }

  const sock = makeWASocket({
    version,
    logger: internalLogger,
    auth: state,
    browser: ['Windows', 'Chrome', '10.0'],
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async (key) => {
      const msg = await store.loadMessage(key.remoteJid, key.id)
      return msg?.message || undefined
    },
  })

  store.bind(sock.ev)

  if (!sock.authState.creds.registered) {
    const nomor = await ask('[Yebail] Masukkan nomor HP (tanpa +, contoh 628123456789): ')
    const code = await sock.requestPairingCode(nomor)
    logger.info(`[Yebail] Pairing code: ${code}`)
  }

  sock.ev.process(async (events) => {
    if (events['connection.update']) {
      const { connection, lastDisconnect } = events['connection.update']
      logConnection({ connection })
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true
        if (shouldReconnect) startBot()
      }
    }

    if (events['creds.update']) await saveCreds()

    if (events['groups.update']) {
      for (const update of events['groups.update']) {
        const meta = await sock.groupMetadata(update.id)
        groupCache.set(update.id, meta)
      }
    }

    if (events['group-participants.update']) {
      const { id } = events['group-participants.update']
      const meta = await sock.groupMetadata(id)
      groupCache.set(id, meta)
    }

    if (events['messages.update']) {
      for (const { key, update } of events['messages.update']) {
        if (update.pollUpdates) {
          const pollCreation = await store.loadMessage(key.remoteJid, key.id)
          if (pollCreation) {
            const votes = getAggregateVotesInPollMessage({ message: pollCreation.message, pollUpdates: update.pollUpdates })
            logger.info(`[Yebail] poll votes: ${JSON.stringify(votes)}`)
          }
        }
      }
    }

    if (events['messages.upsert']) {
      const { messages, type } = events['messages.upsert']
      if (type !== 'notify') return

      for (const msg of messages) {
        if (msg.key.fromMe) continue

        const jid = msg.key.remoteJid
        const rawText = getMessageText(msg)
        const text = rawText.trim().toLowerCase()
        if (!text) continue

        logIncoming({ jid, text: rawText })

        await sock.readMessages([msg.key])
        await sock.sendPresenceUpdate('composing', jid)

        const command = text.split(' ')[0]
        const plugin = commandMap.get(command)

        if (plugin) {
          await logBotEvent(`cmd:${command}`, () => plugin.execute({ sock, msg, text, rawText, jid, store }))
        }

        await sock.sendPresenceUpdate('paused', jid)
      }
    }
  })

  return sock
}
