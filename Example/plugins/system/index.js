import os from 'node:os'
import { performance } from 'node:perf_hooks'

const FALLBACK_TEST_PHONE = '+6280000000000'

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
  commands: ['ping', 'runtime', 'owner', 'self', 'public', 'test'],
  async execute({ sock, jid, command, config, isOwner, senderJid }) {
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

    if (command === 'test') {
      if (!isOwner) {
        return sock.sendMessage(jid, { text: 'This command is owner-only.' })
      }

      const phone = `+${String(senderJid || '').split('@')[0] || FALLBACK_TEST_PHONE.slice(1)}`
      const tests = [
        {
          name: 'Legacy Buttons',
          payload: {
            text: 'TEST 1/6 - Legacy Buttons',
            footer: 'yebail .test',
            buttons: [
              { buttonId: 'test_btn_1', buttonText: { displayText: '✅ OK' } },
              { buttonId: 'test_btn_2', buttonText: { displayText: '❌ NO' } },
            ],
          },
        },
        {
          name: 'Quick Reply',
          payload: {
            text: 'TEST 2/6 - Quick Reply',
            footer: 'yebail .test',
            interactiveButtons: [
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👍 Yes', id: 'yes' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👎 No', id: 'no' }) },
            ],
          },
        },
        {
          name: 'Single Select',
          payload: {
            text: 'TEST 3/6 - Single Select',
            footer: 'yebail .test',
            interactiveButtons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: 'Pilih menu',
                  sections: [
                    {
                      title: 'Menu',
                      rows: [
                        { header: 'A', title: 'Option A', description: 'Demo A', id: 'opt_a' },
                        { header: 'B', title: 'Option B', description: 'Demo B', id: 'opt_b' },
                      ],
                    },
                  ],
                }),
              },
            ],
          },
        },
        {
          name: 'CTA URL',
          payload: {
            text: 'TEST 4/6 - CTA URL',
            footer: 'yebail .test',
            interactiveButtons: [
              {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: '🌐 Open Repo',
                  url: 'https://github.com/yemo-dev/baileys',
                  merchant_url: 'https://github.com/yemo-dev/baileys',
                }),
              },
            ],
          },
        },
        {
          name: 'CTA Copy',
          payload: {
            text: 'TEST 5/6 - CTA Copy',
            footer: 'yebail .test',
            interactiveButtons: [
              {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                  display_text: '📋 Copy Code',
                  id: 'copy_code_demo',
                  copy_code: 'YEBAIL-TEST',
                }),
              },
            ],
          },
        },
        {
          name: 'CTA Call',
          payload: {
            text: 'TEST 6/6 - CTA Call',
            footer: 'yebail .test',
            interactiveButtons: [
              {
                name: 'cta_call',
                buttonParamsJson: JSON.stringify({
                  display_text: '📞 Call',
                  phone_number: phone,
                }),
              },
            ],
          },
        },
      ]

      const failed = []
      for (const test of tests) {
        try {
          await sock.sendMessage(jid, test.payload)
        } catch (error) {
          failed.push(`${test.name}: ${error?.message || error}`)
        }
      }

      if (failed.length) {
        return sock.sendMessage(jid, {
          text: `Interactive test completed with errors:\n- ${failed.join('\n- ')}`,
        })
      }

      return sock.sendMessage(jid, { text: 'Interactive test completed ✅ (6/6 sent).' })
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
