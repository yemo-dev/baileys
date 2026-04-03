import { exec as execCb } from 'node:child_process'
import util from 'node:util'

const exec = util.promisify(execCb)

const safeSerialize = (value) => {
  if (typeof value === 'string') return value
  return util.inspect(value, { depth: 2 })
}

export default {
  name: 'owner',
  commands: ['eval', 'exec'],
  async execute({ sock, jid, command, argText, isOwner, config }) {
    if (!isOwner) {
      return sock.sendMessage(jid, { text: 'This command is owner-only.' })
    }
    if (!config.allowOwnerTools) {
      return sock.sendMessage(jid, {
        text: 'Owner tools are disabled. Set ALLOW_OWNER_TOOLS=true to enable.',
      })
    }

    if (!argText) {
      return sock.sendMessage(jid, { text: `Usage: .${command} <code|shell>` })
    }

    if (command === 'eval') {
      try {
        const fn = new Function(`return (async () => { ${argText} })()`) // eslint-disable-line no-new-func
        const result = await fn()
        return sock.sendMessage(jid, { text: safeSerialize(result) || 'OK' })
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
