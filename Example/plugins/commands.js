import Jimp from 'jimp'
import { getContentType, downloadMediaMessage } from '@yemo-dev/yebail'
import { sleep } from '../src/utils/helpers.js'
import menuPlugin from './menu.js'

const isGroup = (jid = '') => jid.endsWith('@g.us')

const sendMenu = async ({ sock, jid }) => {
  await sock.sendMessage(jid, {
    text: 'Pilih kategori perintah yang ingin kamu gunakan:',
    title: 'Yebail Bot',
    footer: 'Powered by @yemo-dev/yebail',
    buttonText: 'Buka Menu',
    sections: menuPlugin.sections,
  })
}

const sendButtonsCompat = async ({ sock, jid, mode = 'buttons' }) => {
  if (mode === 'buttons') {
    await sock.sendMessage(jid, {
      interactiveMessage: {
        header: { title: '✅ Pilihan Cepat', hasMediaAttachment: false },
        body: { text: 'Pilih salah satu opsi di bawah ini:' },
        footer: { text: 'Yebail Bot' },
        nativeFlowMessage: {
          buttons: [
            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✅ Setuju', id: 'btn_agree' }) },
            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '❌ Tidak Setuju', id: 'btn_disagree' }) },
            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤔 Mungkin', id: 'btn_maybe' }) },
          ],
          messageParamsJson: '',
        },
      },
    })
    return
  }

  await sock.sendMessage(jid, {
    interactiveMessage: {
      header: { title: '🎯 Pilih Paket', hasMediaAttachment: false },
      body: { text: 'Pilih paket langganan yang sesuai:' },
      footer: { text: 'Powered by Yebail' },
      nativeFlowMessage: {
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Pilih paket',
            sections: [{
              title: 'Paket Langganan',
              rows: [
                { header: 'Basic', title: 'Basic – Gratis', description: 'Fitur terbatas', id: 'basic' },
                { header: 'Pro', title: 'Pro – Rp 50.000/bln', description: 'Semua fitur aktif', id: 'pro' },
                { header: 'Premium', title: 'Premium – Rp 100.000/bln', description: 'Prioritas + support', id: 'premium' },
              ],
            }],
          }),
        }],
        messageParamsJson: '',
      },
    },
  })
}

export default {
  name: 'commands',
  commands: [
    '.menu', '.ping', '.link', '.mention', '.reply',
    '.image', '.video', '.gif', '.audio', '.voice', '.ptv', '.doc', '.sticker',
    '.contact', '.location', '.poll', '.react', '.unreact', '.list', '.buttons', '.interactive', '.quickreply',
    '.viewonce', '.album', '.forward', '.edit', '.delete', '.pin', '.markunread', '.archive', '.mute', '.star',
    '.pfp', '.exists', '.status', '.download', '.grayscale', '.resize', '.thumbnail', '.mystatus',
    '.blocklist', '.block', '.unblock', '.setname', '.setstatus', '.privacy', '.disappear',
    '.creategroup', '.groups', '.createnewsletter', '.community', '.bots', '.calllink', '.typing', '.pay',
  ],
  async execute(ctx) {
    const { sock, msg, text, rawText, jid, store } = ctx

    if (text === '.menu') return sendMenu(ctx)
    if (text === '.ping') return sock.sendMessage(jid, { text: '🏓 Pong! Bot aktif.' })
    if (text === '.link') return sock.sendMessage(jid, { text: 'Cek repositori Yebail: https://github.com/yemo-dev/baileys' })
    if (text === '.mention') return sock.sendMessage(jid, { text: `Halo @${jid.split('@')[0]}! 👋`, mentions: [jid] })
    if (text === '.reply') return sock.sendMessage(jid, { text: 'Ini adalah balasan terkutip! 💬' }, { quoted: msg })
    if (text === '.image') return sock.sendMessage(jid, { image: { url: 'https://picsum.photos/800/600' }, caption: '🌄 Gambar acak dari picsum.photos' })
    if (text === '.video') return sock.sendMessage(jid, { video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' }, caption: '🎬 Contoh video' })
    if (text === '.gif') return sock.sendMessage(jid, { video: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4' }, gifPlayback: true, caption: '🎞️ GIF!' })
    if (text === '.audio') return sock.sendMessage(jid, { audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, mimetype: 'audio/mp4' })
    if (text === '.voice') return sock.sendMessage(jid, { audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, mimetype: 'audio/ogg; codecs=opus', ptt: true })
    if (text === '.ptv') return sock.sendMessage(jid, { video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' }, ptv: true })
    if (text === '.doc') return sock.sendMessage(jid, { document: { url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf' }, mimetype: 'application/pdf', fileName: 'contoh.pdf', caption: '📄 Contoh dokumen PDF' })
    if (text === '.sticker') return sock.sendMessage(jid, { sticker: { url: 'https://www.gstatic.com/webp/gallery/1.webp' } })
    if (text === '.contact') return sock.sendMessage(jid, { contacts: { displayName: 'Yebail Bot', contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Yebail Bot\nTEL;type=CELL;type=VOICE;waid=628000000000:+62 800-0000-0000\nEND:VCARD' }] } })
    if (text === '.location') return sock.sendMessage(jid, { location: { degreesLatitude: -6.2088, degreesLongitude: 106.8456, name: 'Jakarta, Indonesia', address: 'DKI Jakarta, Indonesia' } })
    if (text === '.poll') return sock.sendMessage(jid, { poll: { name: '🍉 Buah favorit kamu?', values: ['🍎 Apel', '🍌 Pisang', '🍇 Anggur', '🍓 Stroberi'], selectableCount: 1 } })
    if (text === '.react') return sock.sendMessage(jid, { react: { text: '❤️', key: msg.key } })
    if (text === '.unreact') return sock.sendMessage(jid, { react: { text: '', key: msg.key } })

    if (text === '.list') {
      return sock.sendMessage(jid, {
        listMessage: {
          title: '🍕 Pilih Menu Makanan',
          text: 'Pilih salah satu pilihan di bawah ini:',
          footerText: 'Powered by Yebail',
          buttonText: '🔽 Buka Daftar',
          listType: 1,
          sections: [
            { title: '🍔 Makanan', rows: [
              { title: 'Pizza', description: 'Keju & tomat segar', rowId: 'pizza' },
              { title: 'Burger', description: 'Daging sapi pilihan', rowId: 'burger' },
              { title: 'Nasi Goreng', description: 'Khas Indonesia', rowId: 'nasigoreng' },
            ] },
            { title: '🥤 Minuman', rows: [
              { title: 'Cola', description: 'Segar & dingin', rowId: 'cola' },
              { title: 'Jus Jeruk', description: 'Buah segar', rowId: 'juice' },
              { title: 'Teh Tarik', description: 'Khas Malaysia', rowId: 'teh' },
            ] },
          ],
        },
      })
    }

    if (text === '.buttons') return sendButtonsCompat({ ...ctx, mode: 'buttons' })
    if (text === '.interactive') return sendButtonsCompat({ ...ctx, mode: 'interactive' })
    if (text === '.quickreply') {
      return sock.sendMessage(jid, {
        interactiveMessage: {
          header: { title: '😊 Bagaimana Harimu?', hasMediaAttachment: false },
          body: { text: 'Pilih salah satu untuk membalas cepat:' },
          footer: { text: 'Yebail' },
          nativeFlowMessage: {
            buttons: [
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😄 Sangat Baik!', id: 'great' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😐 Biasa Saja', id: 'ok' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😔 Kurang Baik', id: 'bad' }) },
            ],
            messageParamsJson: '',
          },
        },
      })
    }

    if (text === '.viewonce') return sock.sendMessage(jid, { image: { url: 'https://picsum.photos/400/400' }, caption: '👁️ Hanya bisa dilihat sekali!', viewOnce: true })
    if (text === '.album') return sock.sendAlbumMessage(jid, [
      { image: { url: 'https://picsum.photos/800/600?random=1' }, caption: '📸 Foto 1' },
      { image: { url: 'https://picsum.photos/800/600?random=2' }, caption: '📸 Foto 2' },
      { image: { url: 'https://picsum.photos/800/600?random=3' }, caption: '📸 Foto 3' },
    ])
    if (text === '.forward') return sock.sendMessage(jid, { forward: msg, force: true })
    if (text === '.edit') {
      const sent = await sock.sendMessage(jid, { text: '✏️ Pesan asli...' })
      await sleep(2000)
      return sock.sendMessage(jid, { text: '✅ Pesan sudah diedit!', edit: sent.key })
    }
    if (text === '.delete') {
      const sent = await sock.sendMessage(jid, { text: '🗑️ Pesan ini akan dihapus dalam 3 detik...' })
      await sleep(3000)
      return sock.sendMessage(jid, { delete: sent.key })
    }
    if (text === '.pin') {
      const sent = await sock.sendMessage(jid, { text: '📌 Pesan disematkan!' })
      return sock.sendMessage(jid, { pin: sent.key, type: 1 })
    }
    if (text === '.markunread') return sock.chatModify({ markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
    if (text === '.archive') {
      await sock.chatModify({ archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
      return sock.sendMessage(jid, { text: '📦 Chat berhasil diarsipkan.' })
    }
    if (text === '.mute') {
      await sock.chatModify({ mute: Date.now() + 8 * 60 * 60 * 1000 }, jid)
      return sock.sendMessage(jid, { text: '🔇 Chat dibisukan selama 8 jam.' })
    }
    if (text === '.star') {
      await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)
      return sock.sendMessage(jid, { text: '⭐ Pesan diberi bintang.' })
    }
    if (text === '.pfp') {
      const url = await sock.profilePictureUrl(jid, 'image').catch(() => null)
      return sock.sendMessage(jid, { text: url ? `🖼️ Foto profil: ${url}` : '❌ Tidak ada foto profil.' })
    }
    if (text === '.exists') {
      const [result] = (await sock.onWhatsApp(jid)) || []
      return sock.sendMessage(jid, { text: result?.exists ? `✅ ${jid} terdaftar di WhatsApp (LID: ${result.lid || 'n/a'})` : '❌ Nomor tidak ditemukan di WhatsApp.' })
    }
    if (text === '.status') {
      const statuses = await sock.fetchStatus(jid).catch(() => [])
      const statusText = statuses?.[0]?.status || 'Belum ada status'
      return sock.sendMessage(jid, { text: `ℹ️ Status: ${statusText}` })
    }
    if (text === '.download' || text === '.grayscale' || text === '.resize' || text === '.thumbnail') {
      const chatMsgs = store.messages[jid]?.array || []
      if (text === '.download') {
        const mediaMsg = [...chatMsgs].reverse().find((m) => {
          const c = m.message
          if (!c) return false
          const t = getContentType(c)
          return ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(t)
        })
        if (!mediaMsg) return sock.sendMessage(jid, { text: '❌ Tidak ada media yang bisa diunduh di chat ini.' })
        const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {})
        return sock.sendMessage(jid, { text: `✅ Unduhan berhasil: ${buffer.length} bytes` })
      }

      const imgMsg = [...chatMsgs].reverse().find((m) => getContentType(m.message || {}) === 'imageMessage')
      if (!imgMsg) return sock.sendMessage(jid, { text: '❌ Tidak ada gambar di chat ini untuk diproses.' })

      try {
        const buffer = await downloadMediaMessage(imgMsg, 'buffer', {})
        const image = await Jimp.read(buffer)
        const MIME_JPEG = Jimp.MIME_JPEG || 'image/jpeg'
        const jimpAuto = Jimp.AUTO !== null && Jimp.AUTO !== undefined ? Jimp.AUTO : -1
        const getBuffer = (img) => typeof img.getBufferAsync === 'function' ? img.getBufferAsync(MIME_JPEG) : img.getBuffer(MIME_JPEG)

        if (text === '.grayscale') {
          image.grayscale()
          return sock.sendMessage(jid, { image: await getBuffer(image), caption: '🖤 Gambar hitam putih' })
        }
        if (text === '.resize') {
          image.resize(512, jimpAuto)
          return sock.sendMessage(jid, { image: await getBuffer(image), caption: '📐 Gambar di-resize ke lebar 512px' })
        }

        image.cover(200, 200)
        return sock.sendMessage(jid, { image: await getBuffer(image), caption: '🖼️ Thumbnail 200×200' })
      } catch {
        return sock.sendMessage(jid, { text: '❌ Gagal memproses gambar. Pastikan format gambar valid.' })
      }
    }

    if (text === '.mystatus') {
      await sock.sendStatusMentions({ text: '🚀 Powered by @yemo-dev/yebail!' }, [jid])
      return sock.sendMessage(jid, { text: '✅ Status berhasil diposting dengan mention kamu!' })
    }
    if (text === '.blocklist') {
      const list = await sock.fetchBlocklist()
      return sock.sendMessage(jid, { text: `🚫 Daftar blokir (${list.length} entri):\n${list.join('\n') || '(kosong)'}` })
    }
    if (text === '.block') return sock.updateBlockStatus(jid, 'block')
    if (text === '.unblock') return sock.updateBlockStatus(jid, 'unblock')
    if (text === '.setname') {
      await sock.updateProfileName('Yebail Bot 🤖')
      return sock.sendMessage(jid, { text: '✅ Nama profil berhasil diperbarui!' })
    }
    if (text === '.setstatus') {
      await sock.updateProfileStatus('🚀 Running on @yemo-dev/yebail')
      return sock.sendMessage(jid, { text: '✅ Status profil berhasil diperbarui!' })
    }
    if (text === '.privacy') {
      await sock.updateLastSeenPrivacy('contacts')
      await sock.updateOnlinePrivacy('match_last_seen')
      await sock.updateProfilePicturePrivacy('contacts')
      await sock.updateStatusPrivacy('contacts')
      await sock.updateReadReceiptsPrivacy('all')
      await sock.updateGroupsAddPrivacy('contacts')
      return sock.sendMessage(jid, { text: '✅ Pengaturan privasi berhasil diperbarui.' })
    }
    if (text === '.disappear') {
      await sock.updateDefaultDisappearingMode(90 * 24 * 60 * 60)
      return sock.sendMessage(jid, { text: '✅ Mode pesan hilang default diatur ke 90 hari.' })
    }
    if (text === '.creategroup') {
      const group = await sock.groupCreate('Yebail Test Group', [jid])
      return sock.sendMessage(jid, { text: `✅ Grup dibuat! JID: ${group.id}` })
    }
    if (text.startsWith('.invitelink ')) {
      const groupJid = rawText.replace(/\.invitelink\s+/i, '').trim()
      const code = await sock.groupInviteCode(groupJid)
      return sock.sendMessage(jid, { text: `🔗 Link undangan: https://chat.whatsapp.com/${code}` })
    }
    if (text.startsWith('.joingroup ')) {
      const code = rawText.replace(/\.joingroup\s+/i, '').trim()
      const groupJid = await sock.groupAcceptInvite(code)
      return sock.sendMessage(jid, { text: `✅ Bergabung ke grup: ${groupJid}` })
    }
    if (text.startsWith('.groupinfo ')) {
      const groupJid = rawText.replace(/\.groupinfo\s+/i, '').trim()
      const meta = await sock.groupMetadata(groupJid)
      return sock.sendMessage(jid, {
        text: [
          '📋 *Info Grup*',
          `• Nama: ${meta.subject}`,
          `• ID: ${meta.id}`,
          `• Anggota: ${meta.size || meta.participants.length}`,
          `• Deskripsi: ${meta.desc || '(tidak ada)'}`,
          `• Owner: ${meta.owner}`,
        ].join('\n'),
      })
    }
    if (text === '.groups') {
      const groups = await sock.groupFetchAllParticipating()
      const names = Object.values(groups).map((g) => `• ${g.subject} (${g.id})`).join('\n')
      return sock.sendMessage(jid, { text: `👥 Grup (${Object.keys(groups).length}):\n${names || '(tidak ada)'}` })
    }
    if (text === '.createnewsletter') {
      const nl = await sock.newsletterCreate('Yebail News', 'Update resmi Yebail')
      return sock.sendMessage(jid, { text: `✅ Newsletter dibuat: ${nl.id}` })
    }
    if (text === '.community') {
      const community = await sock.communityCreate('Yebail Community', 'Selamat datang di komunitas Yebail!')
      const communityId = community?.value?.id || '(cek WhatsApp kamu)'
      return sock.sendMessage(jid, { text: `✅ Komunitas dibuat: ${communityId}` })
    }
    if (text === '.bots') {
      const bots = await sock.getBotListV2()
      return sock.sendMessage(jid, { text: `🤖 Bot tersedia:\n${JSON.stringify(bots, null, 2)}` })
    }
    if (text === '.calllink') {
      const token = await sock.createCallLink('video')
      return sock.sendMessage(jid, { text: `📹 Token link panggilan: ${token}` })
    }
    if (text === '.typing') {
      await sock.sendPresenceUpdate('composing', jid)
      await sleep(3000)
      await sock.sendPresenceUpdate('paused', jid)
      return sock.sendMessage(jid, { text: '✅ Simulasi mengetik selesai.' })
    }
    if (text === '.pay') {
      return sock.sendMessage(jid, {
        requestPaymentMessage: {
          currencyCodeIso4217: 'IDR',
          amount1000: 50000 * 1000,
          requestFrom: sock.authState.creds.me.id,
          noteMessage: { extendedTextMessage: { text: '💰 Pembayaran untuk layanan bot' } },
        },
      })
    }

    if (rawText.startsWith('.')) {
      return sock.sendMessage(jid, { text: `❓ Command tidak dikenal: ${rawText}` })
    }

    if (!isGroup(jid)) {
      return sock.sendMessage(jid, { text: 'Kirim *.menu* untuk daftar command.' })
    }
  },
}
