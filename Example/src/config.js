const toJid = (value = '') => {
  const clean = String(value || '').replace(/[^0-9]/g, '')
  return clean ? `${clean}@s.whatsapp.net` : ''
}

const ownersFromEnv = (process.env.BOT_OWNER || '')
  .split(',')
  .map((v) => toJid(v.trim()))
  .filter(Boolean)

const config = {
  botName: process.env.BOT_NAME || 'botz',
  prefix: process.env.BOT_PREFIX || '.',
  owners: ownersFromEnv,
}

export const isOwnerJid = (jid = '') => config.owners.includes(jid)

export default config
