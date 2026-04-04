const isGroupJid = (jid = '') => jid.endsWith('@g.us')

const ensureGroup = async ({ sock, jid }) => {
  if (isGroupJid(jid)) return true
  await sock.sendMessage(jid, { text: 'This command is only available in groups.' })
  return false
}

const ensureBotAdmin = async ({ sock, jid }) => {
  const meta = await sock.groupMetadata(jid)
  const meId = sock.authState?.creds?.me?.id
  if (!meId) {
    await sock.sendMessage(jid, { text: 'Unable to verify bot identity yet. Please try again.' })
    return { ok: false, meta }
  }
  const me = meId.split(':')[0] + '@s.whatsapp.net'
  const meData = meta.participants.find((p) => p.id === me)
  if (meData?.admin) return { ok: true, meta }
  await sock.sendMessage(jid, { text: 'Bot must be group admin for this action.' })
  return { ok: false, meta }
}

const mentionedTargets = (msg) => {
  const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  return [...new Set(mentions)]
}

export default {
  name: 'group',
  commands: ['groupmenu', 'kick', 'add', 'promote', 'demote', 'open', 'close', 'tagall', 'hidetag', 'grouplink', 'revoke'],
  async execute(ctx) {
    const { sock, jid, command, args, msg } = ctx

    if (!(await ensureGroup({ sock, jid }))) return

    if (command === 'groupmenu') {
      const lines = [
        'Group Commands',
        '.groupmenu',
        '.kick @user',
        '.add <number>',
        '.promote @user',
        '.demote @user',
        '.open',
        '.close',
        '.tagall [text]',
        '.hidetag <text>',
        '.grouplink',
        '.revoke',
      ]
      return sock.sendMessage(jid, { text: lines.join('\n') })
    }

    const { ok } = await ensureBotAdmin({ sock, jid })
    if (!ok) return

    if (command === 'kick') {
      const targets = mentionedTargets(msg)
      if (!targets.length) return sock.sendMessage(jid, { text: 'Mention users to kick.' })
      await sock.groupParticipantsUpdate(jid, targets, 'remove')
      return sock.sendMessage(jid, { text: 'Users removed.' })
    }

    if (command === 'add') {
      const number = (args[0] || '').replace(/\D/g, '')
      if (!number) return sock.sendMessage(jid, { text: 'Usage: .add <number>' })
      await sock.groupParticipantsUpdate(jid, [`${number}@s.whatsapp.net`], 'add')
      return sock.sendMessage(jid, { text: 'User added.' })
    }

    if (command === 'promote') {
      const targets = mentionedTargets(msg)
      if (!targets.length) return sock.sendMessage(jid, { text: 'Mention users to promote.' })
      await sock.groupParticipantsUpdate(jid, targets, 'promote')
      return sock.sendMessage(jid, { text: 'Users promoted.' })
    }

    if (command === 'demote') {
      const targets = mentionedTargets(msg)
      if (!targets.length) return sock.sendMessage(jid, { text: 'Mention users to demote.' })
      await sock.groupParticipantsUpdate(jid, targets, 'demote')
      return sock.sendMessage(jid, { text: 'Users demoted.' })
    }

    if (command === 'open') {
      await sock.groupSettingUpdate(jid, 'not_announcement')
      return sock.sendMessage(jid, { text: 'Group is now open for all participants.' })
    }

    if (command === 'close') {
      await sock.groupSettingUpdate(jid, 'announcement')
      return sock.sendMessage(jid, { text: 'Group is now admin-only.' })
    }

    if (command === 'tagall') {
      const meta = await sock.groupMetadata(jid)
      const mentions = meta.participants.map((p) => p.id)
      const body = args.length ? args.join(' ') : 'Tagging all members.'
      const text = `${body}\n\n${mentions.map((m) => `@${m.split('@')[0]}`).join('\n')}`
      return sock.sendMessage(jid, { text, mentions })
    }

    if (command === 'hidetag') {
      const meta = await sock.groupMetadata(jid)
      const mentions = meta.participants.map((p) => p.id)
      const body = args.length ? args.join(' ') : 'Hidden tag message'
      return sock.sendMessage(jid, { text: body, mentions })
    }

    if (command === 'grouplink') {
      const code = await sock.groupInviteCode(jid)
      return sock.sendMessage(jid, { text: `https://chat.whatsapp.com/${code}` })
    }

    await sock.groupRevokeInvite(jid)
    return sock.sendMessage(jid, { text: 'Group invite link revoked.' })
  },
}
