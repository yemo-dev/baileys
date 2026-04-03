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
} from '@yemo-dev/yebail'
import logger, { internalLogger } from './utils/logger.js'
import { ask } from './utils/helpers.js'
import { logBotEvent, logConnection, logIncoming } from './utils/logBotEvent.js'
import config, { isOwnerJid } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.resolve(ROOT, 'plugins')
const makeWASocket = yebail.makeWASocket || yebail.default || yebail

const listPluginFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listPluginFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files.sort()
}

const loadPlugins = async (pluginsDir) => {
  const files = await listPluginFiles(pluginsDir)
  const plugins = []
  for (const fullPath of files) {
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
  logger.info(`WhatsApp Web version: ${version.join('.')} (latest: ${isLatest ? 'yes' : 'no'})`)
  logger.info(`Command prefix: ${config.prefix}`)

  const plugins = await loadPlugins(PLUGINS_DIR)
  const commandMap = new Map()
  for (const plugin of plugins) {
    for (const command of plugin.commands) commandMap.set(command.toLowerCase(), plugin)
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
    const phoneNumber = await ask('Enter phone number (country code, digits only): ')
    const code = await sock.requestPairingCode(phoneNumber)
    logger.info(`Pairing code: ${code}`)
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

    if (events['messages.upsert']) {
      const { messages, type } = events['messages.upsert']
      if (type !== 'notify') return

      for (const msg of messages) {
        if (msg.key.fromMe) continue

        const jid = msg.key.remoteJid
        const rawText = getMessageText(msg)
        const text = rawText.trim()
        if (!text || !text.startsWith(config.prefix)) continue

        logIncoming({ jid, text: rawText })

        await sock.readMessages([msg.key])
        await sock.sendPresenceUpdate('composing', jid)

        const body = text.slice(config.prefix.length).trim()
        if (!body) continue

        const [head = '', ...args] = body.split(/\s+/)
        const command = head.toLowerCase()
        const argText = body.slice(head.length).trim()
        const senderJid = msg.key.participant || msg.key.remoteJid
        const isOwner = isOwnerJid(senderJid)
        const plugin = commandMap.get(command)

        if (plugin) {
          await logBotEvent(`cmd:${command}`, () => plugin.execute({
            sock,
            msg,
            text,
            rawText,
            jid,
            store,
            config,
            command,
            args,
            argText,
            senderJid,
            isOwner,
          }))
        } else {
          await sock.sendMessage(jid, { text: `Unknown command: ${config.prefix}${command}` })
        }

        await sock.sendPresenceUpdate('paused', jid)
      }
    }
  })

  return sock
}
