import os from 'node:os'
import { performance } from 'node:perf_hooks'

const uptime = (seconds = 0) => {
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${d}d ${h}h ${m}m ${sec}s`
}

export default {
  name: 'system',
  commands: ['ping', 'runtime', 'owner', 'self', 'public'],
  async execute({ sock, jid, command, config, isOwner }) {
    if (command === 'ping') {
      const start = performance.now()
      const msg = await sock.sendMessage(jid, { text: 'Pinging...' })
      const latency = (performance.now() - start).toFixed(2)
      const cpuModel = os.cpus()?.[0]?.model || 'Unknown CPU'
      const text = [
        'PONG',
        `Latency: ${latency} ms`,
        `Runtime: ${uptime(process.uptime())}`,
        `Platform: ${os.platform()} ${os.release()}`,
        `CPU Cores: ${os.cpus()?.length || 0}`,
        `CPU Model: ${cpuModel}`,
        `Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB RSS`,
      ].join('\n')
      return sock.sendMessage(jid, { text, edit: msg.key })
    }

    if (command === 'runtime') {
      return sock.sendMessage(jid, {
        text: `Runtime: ${uptime(process.uptime())}`,
      })
    }

    if (command === 'self' || command === 'public') {
      if (!isOwner) {
        return sock.sendMessage(jid, { text: 'This command is owner-only.' })
      }
      config.mode = command
      return sock.sendMessage(jid, { text: `Bot mode changed to ${config.mode}.` })
    }

    return sock.sendMessage(jid, {
      text: config.owners.length
        ? `Owner JIDs:\n${config.owners.join('\n')}\nMode: ${config.mode}`
        : 'Owner is not configured yet.',
    })
  },
}
