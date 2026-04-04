import { exec as execCb } from 'node:child_process'
import util from 'node:util'

const exec = util.promisify(execCb)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

const summarizeResult = (value) => {
  if (value === undefined) return 'OK'
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (typeof value === 'function') return `[Function${value.name ? `: ${value.name}` : ''}]`

  const key = value?.key
  if (key && typeof key === 'object' && typeof value === 'object') {
    const id = key.id || '-'
    const remoteJid = key.remoteJid || '-'
    return `Sent ✅\nID: ${id}\nJID: ${remoteJid}`
  }

  return safeSerialize(value)
}

const safeSerialize = (value) => {
  if (typeof value === 'string') return value
  return util.inspect(value, { depth: 2 })
}

export default {
  name: 'owner',
  commands: ['eval', 'exec'],
  async execute({ sock, msg, jid, command, argText, args, text, rawText, senderJid, isOwner, config, store }) {
    if (!isOwner) {
      return sock.sendMessage(jid, { text: 'This command is owner-only.' })
    }
    if (!config.allowOwnerTools) {
      return sock.sendMessage(jid, {
        text: 'Owner tools are disabled. Set ALLOW_OWNER_TOOLS=true to enable.',
      })
    }

    if (!argText) {
      return sock.sendMessage(jid, { text: command === 'eval' ? 'Usage: > <javascript>' : 'Usage: => <shell command>' })
    }

    if (command === 'eval') {
      try {
        const m = { ...msg, chat: jid, sender: senderJid, text: rawText }
        const context = {
          m,
          msg,
          jid,
          sock,
          store,
          config,
          args,
          text,
          rawText,
          senderJid,
          isOwner,
        }
        const names = Object.keys(context)
        const values = Object.values(context)

        let result
        try {
          const evalExpression = new AsyncFunction(...names, `"use strict"; return (${argText})`)
          result = await evalExpression(...values)
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error
          const evalStatement = new AsyncFunction(...names, `"use strict"; ${argText}`)
          result = await evalStatement(...values)
        }
        return sock.sendMessage(jid, { text: summarizeResult(result) })
      } catch (error) {
        return sock.sendMessage(jid, { text: `Eval error: ${error?.message || error}` })
      }
    }

    try {
      const { stdout, stderr } = await exec(argText, { timeout: 20_000 })
      const out = [stdout?.trim(), stderr?.trim()].filter(Boolean).join('\n') || 'OK'
      return sock.sendMessage(jid, { text: out.slice(0, 3500) })
    } catch (error) {
      const out = [error?.stdout?.trim(), error?.stderr?.trim(), error?.message].filter(Boolean).join('\n')
      return sock.sendMessage(jid, { text: out.slice(0, 3500) || 'Exec failed.' })
    }
  },
}
