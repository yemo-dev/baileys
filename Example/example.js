/**
 * @yemo-dev/yebail — Example Bot
 *
 * Setup:
 *   npm install @yemo-dev/yebail pino @hapi/boom @cacheable/node-cache
 *
 * Jalankan:
 *   node Example/example.js
 *
 * Pertama kali akan muncul QR code di terminal — scan dengan WhatsApp.
 * Atau aktifkan pairing code (lihat blok yang dikomentari di bawah).
 *
 * Kirim salah satu perintah berikut ke bot untuk menguji fitur:
 *   !help — daftar semua perintah
 */

'use strict'

const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeInMemoryStore,
    getContentType,
    downloadMediaMessage,
    getAggregateVotesInPollMessage,
    Browsers,
} = require('../lib')

const P = require('pino')
const { Boom } = require('@hapi/boom')
const NodeCache = require('@cacheable/node-cache')
const fs = require('fs')

const logger = P({ level: 'silent' })

const store = makeInMemoryStore({ logger })
store.readFromFile('./baileys_store.json')
setInterval(() => store.writeToFile('./baileys_store.json'), 10_000)

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

function getMessageText(msg) {
    const content = msg?.message
    if (!content) return ''
    const type = getContentType(content)
    if (!type) return ''
    return content[type]?.text || content[type]?.caption || content?.conversation || ''
}

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        browser: Browsers.ubuntu('YebailBot'),
        printQRInTerminal: true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || undefined
            }
            return { conversation: 'hello' }
        },
    })

    store.bind(sock.ev)

    /*
     * Untuk menggunakan Pairing Code alih-alih QR, set printQRInTerminal: false
     * lalu aktifkan blok berikut:
     *
     * if (!sock.authState.creds.registered) {
     *     const phoneNumber = '628xxxxxxxxx'
     *     const code = await sock.requestPairingCode(phoneNumber)
     *     console.log('Pairing code:', code)
     * }
     */

    sock.ev.process(async (events) => {
        if (events['connection.update']) {
            const { connection, lastDisconnect, qr } = events['connection.update']
            if (qr) console.log('Scan QR code untuk login.')
            if (connection === 'close') {
                const shouldReconnect =
                    lastDisconnect?.error instanceof Boom
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                        : true
                console.log('Koneksi tertutup. Menghubungkan ulang:', shouldReconnect)
                if (shouldReconnect) startSock()
            } else if (connection === 'open') {
                console.log('Koneksi berhasil!')
            }
        }

        if (events['creds.update']) {
            await saveCreds()
        }

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
                        const votes = getAggregateVotesInPollMessage({
                            message: pollCreation.message,
                            pollUpdates: update.pollUpdates,
                        })
                        console.log('Hasil poll:', votes)
                    }
                }
            }
        }

        if (events['messages.reaction']) {
            for (const reaction of events['messages.reaction']) {
                console.log(`Reaksi dari ${reaction.key.remoteJid}: ${reaction.reaction?.text || '(dihapus)'}`)
            }
        }

        if (events['call']) {
            for (const call of events['call']) {
                console.log(`Panggilan masuk dari ${call.from} — status: ${call.status}`)
                if (call.status === 'offer') {
                    await sock.rejectCall(call.id, call.from)
                }
            }
        }

        if (events['presence.update']) {
            const { id, presences } = events['presence.update']
            for (const [jid, presence] of Object.entries(presences)) {
                console.log(`Presence ${jid} di ${id}: ${presence.lastKnownPresence}`)
            }
        }

        if (events['messages.upsert']) {
            const { messages, type } = events['messages.upsert']
            if (type !== 'notify') return

            for (const msg of messages) {
                if (msg.key.fromMe) continue

                const jid = msg.key.remoteJid
                const text = getMessageText(msg).trim().toLowerCase()

                console.log(`[${jid}] ${text}`)

                await sock.readMessages([msg.key])
                await sock.sendPresenceUpdate('composing', jid)

                if (text === '!ping') {
                    await sock.sendMessage(jid, { text: 'Pong! 🏓' })
                } else if (text === '!link') {
                    await sock.sendMessage(jid, { text: 'Cek https://github.com/yemo-dev/baileys' })
                } else if (text === '!mention') {
                    await sock.sendMessage(jid, {
                        text: `Halo @${jid.split('@')[0]}!`,
                        mentions: [jid],
                    })
                } else if (text === '!reply') {
                    await sock.sendMessage(jid, { text: 'Ini balasan!' }, { quoted: msg })
                } else if (text === '!image') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/800/600' },
                        caption: 'Gambar acak 🌄',
                    })
                } else if (text === '!imagefile') {
                    /*
                     * Untuk mengirim gambar dari file lokal, ganti baris di bawah:
                     * image: fs.readFileSync('./assets/photo.jpg'),
                     */
                    await sock.sendMessage(jid, { text: 'Aktifkan komentar imagefile di example.js untuk mengirim dari file lokal.' })
                } else if (text === '!video') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        caption: 'Contoh video 🎬',
                    })
                } else if (text === '!gif') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4' },
                        gifPlayback: true,
                        caption: 'GIF! 🎞️',
                    })
                } else if (text === '!audio') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/mp4',
                    })
                } else if (text === '!voice') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                    })
                } else if (text === '!ptv') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        ptv: true,
                    })
                } else if (text === '!doc') {
                    await sock.sendMessage(jid, {
                        document: { url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf' },
                        mimetype: 'application/pdf',
                        fileName: 'sample.pdf',
                        caption: 'Contoh dokumen PDF 📄',
                    })
                } else if (text === '!sticker') {
                    await sock.sendMessage(jid, {
                        sticker: { url: 'https://www.gstatic.com/webp/gallery/1.webp' },
                    })
                } else if (text === '!contact') {
                    await sock.sendMessage(jid, {
                        contacts: {
                            displayName: 'Yebail Bot',
                            contacts: [{
                                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Yebail Bot\nTEL;type=CELL;type=VOICE;waid=628000000000:+62 800-0000-0000\nEND:VCARD`,
                            }],
                        },
                    })
                } else if (text === '!contacts') {
                    await sock.sendMessage(jid, {
                        contacts: {
                            displayName: 'Dua Kontak',
                            contacts: [
                                { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Alice\nTEL;waid=628111111111:+62 811-1111-1111\nEND:VCARD` },
                                { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bob\nTEL;waid=628222222222:+62 822-2222-2222\nEND:VCARD` },
                            ],
                        },
                    })
                } else if (text === '!location') {
                    await sock.sendMessage(jid, {
                        location: {
                            degreesLatitude: -6.2088,
                            degreesLongitude: 106.8456,
                            name: 'Jakarta, Indonesia',
                            address: 'DKI Jakarta, Indonesia',
                        },
                    })
                } else if (text === '!livelocation') {
                    await sock.sendMessage(jid, {
                        liveLocation: {
                            degreesLatitude: -6.2088,
                            degreesLongitude: 106.8456,
                            accuracyInMeters: 10,
                            speedInMps: 0,
                            degreesClockwiseFromMagneticNorth: 0,
                            caption: 'Berbagi lokasi live',
                            sequenceNumber: BigInt(Date.now()),
                            timeSinceLastUpdate: 0,
                        },
                        caption: 'Berbagi lokasi live selama 30 menit',
                    })
                } else if (text === '!poll') {
                    await sock.sendMessage(jid, {
                        poll: {
                            name: 'Buah favorit kamu?',
                            values: ['🍎 Apel', '🍌 Pisang', '🍇 Anggur', '🍓 Stroberi'],
                            selectableCount: 1,
                        },
                    })
                } else if (text === '!react') {
                    await sock.sendMessage(jid, { react: { text: '❤️', key: msg.key } })
                } else if (text === '!unreact') {
                    await sock.sendMessage(jid, { react: { text: '', key: msg.key } })
                } else if (text === '!list') {
                    await sock.sendMessage(jid, {
                        listMessage: {
                            title: '🍕 Pilih menu',
                            text: 'Pilih salah satu:',
                            footerText: 'Powered by Yebail',
                            buttonText: 'Buka Menu',
                            listType: 1,
                            sections: [
                                {
                                    title: 'Makanan',
                                    rows: [
                                        { title: 'Pizza', description: 'Keju & tomat', rowId: 'pizza' },
                                        { title: 'Burger', description: 'Daging sapi', rowId: 'burger' },
                                    ],
                                },
                                {
                                    title: 'Minuman',
                                    rows: [
                                        { title: 'Cola', description: 'Dingin', rowId: 'cola' },
                                        { title: 'Jus', description: 'Jeruk segar', rowId: 'juice' },
                                    ],
                                },
                            ],
                        },
                    })
                } else if (text === '!buttons') {
                    await sock.sendMessage(jid, {
                        buttonsMessage: {
                            text: 'Pilih salah satu:',
                            footerText: 'Yebail Bot',
                            headerType: 1,
                            buttons: [
                                { buttonId: 'btn1', buttonText: { displayText: 'Opsi 1' }, type: 1 },
                                { buttonId: 'btn2', buttonText: { displayText: 'Opsi 2' }, type: 1 },
                                { buttonId: 'btn3', buttonText: { displayText: 'Opsi 3' }, type: 1 },
                            ],
                        },
                    })
                } else if (text === '!interactive') {
                    await sock.sendMessage(jid, {
                        interactiveMessage: {
                            header: { title: '🎯 Pilih paket', hasMediaAttachment: false },
                            body: { text: 'Pilih paket langganan:' },
                            footer: { text: 'Yebail' },
                            nativeFlowMessage: {
                                buttons: [{
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: 'Pilih paket',
                                        sections: [{
                                            title: 'Paket',
                                            rows: [
                                                { header: 'Basic', title: 'Basic – Gratis', description: 'Fitur terbatas', id: 'basic' },
                                                { header: 'Pro', title: 'Pro – $9/bln', description: 'Semua fitur', id: 'pro' },
                                            ],
                                        }],
                                    }),
                                }],
                                messageParamsJson: '',
                            },
                        },
                    })
                } else if (text === '!quickreply') {
                    await sock.sendMessage(jid, {
                        interactiveMessage: {
                            header: { title: 'Quick reply', hasMediaAttachment: false },
                            body: { text: 'Hari ini perasaan kamu?' },
                            footer: { text: 'Yebail' },
                            nativeFlowMessage: {
                                buttons: [
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😊 Baik', id: 'good' }) },
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😔 Kurang baik', id: 'bad' }) },
                                ],
                                messageParamsJson: '',
                            },
                        },
                    })
                } else if (text === '!pay') {
                    await sock.sendMessage(jid, {
                        requestPaymentMessage: {
                            currencyCodeIso4217: 'IDR',
                            amount1000: 50000 * 1000,
                            requestFrom: sock.authState.creds.me.id,
                            noteMessage: {
                                extendedTextMessage: {
                                    text: 'Pembayaran untuk layanan bot',
                                },
                            },
                        },
                    })
                } else if (text === '!viewonce') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/400/400' },
                        caption: 'Hanya bisa dilihat sekali!',
                        viewOnce: true,
                    })
                } else if (text === '!album') {
                    await sock.sendAlbumMessage(jid, [
                        { image: { url: 'https://picsum.photos/800/600?random=1' }, caption: 'Foto 1' },
                        { image: { url: 'https://picsum.photos/800/600?random=2' }, caption: 'Foto 2' },
                        { image: { url: 'https://picsum.photos/800/600?random=3' } },
                    ])
                } else if (text === '!forward') {
                    await sock.sendMessage(jid, { forward: msg, force: true })
                } else if (text === '!edit') {
                    const sent = await sock.sendMessage(jid, { text: 'Pesan asli...' })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.sendMessage(jid, { text: 'Pesan sudah diedit ✅', edit: sent.key })
                } else if (text === '!delete') {
                    const sent = await sock.sendMessage(jid, { text: 'Pesan ini akan dihapus dalam 3 detik...' })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.sendMessage(jid, { delete: sent.key })
                } else if (text === '!pin') {
                    const sent = await sock.sendMessage(jid, { text: 'Pesan disematkan 📌' })
                    await sock.sendMessage(jid, { pin: sent.key, type: 1 })
                } else if (text === '!markunread') {
                    await sock.chatModify({ markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                } else if (text === '!archive') {
                    await sock.chatModify({ archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                    await sock.sendMessage(jid, { text: 'Chat diarsipkan 📦' })
                } else if (text === '!mute') {
                    const muteUntil = Date.now() + 8 * 60 * 60 * 1000
                    await sock.chatModify({ mute: muteUntil }, jid)
                    await sock.sendMessage(jid, { text: 'Chat dibisukan selama 8 jam 🔇' })
                } else if (text === '!deletechat') {
                    await sock.chatModify({ delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                } else if (text === '!star') {
                    await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)
                    await sock.sendMessage(jid, { text: 'Pesan diberi bintang ⭐' })
                } else if (text === '!pfp') {
                    const url = await sock.profilePictureUrl(jid, 'image')
                    await sock.sendMessage(jid, { text: url ? `Foto profil: ${url}` : 'Tidak ada foto profil.' })
                } else if (text === '!exists') {
                    const [result] = await sock.onWhatsApp(jid) || []
                    await sock.sendMessage(jid, {
                        text: result?.exists
                            ? `✅ ${jid} terdaftar di WhatsApp (LID: ${result.lid || 'n/a'})`
                            : `❌ Nomor tidak ditemukan di WhatsApp`,
                    })
                } else if (text === '!status') {
                    const statuses = await sock.fetchStatus(jid)
                    const s = statuses?.[0]?.status || 'Belum ada status'
                    await sock.sendMessage(jid, { text: `Status: ${s}` })
                } else if (text === '!download') {
                    const chatMsgs = store.messages[jid]?.array || []
                    const mediaMsg = [...chatMsgs].reverse().find(m => {
                        const c = m.message
                        if (!c) return false
                        const t = getContentType(c)
                        return ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(t)
                    })
                    if (mediaMsg) {
                        const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {})
                        await sock.sendMessage(jid, { text: `Unduhan berhasil: ${buffer.length} bytes ✅` })
                    } else {
                        await sock.sendMessage(jid, { text: 'Tidak ada media yang bisa diunduh di chat ini.' })
                    }
                } else if (text === '!mystatus') {
                    await sock.sendStatusMentions(
                        { text: '🚀 Powered by @yemo-dev/yebail!' },
                        [jid]
                    )
                    await sock.sendMessage(jid, { text: 'Status berhasil diposting dengan mention kamu!' })
                } else if (text === '!blocklist') {
                    const list = await sock.fetchBlocklist()
                    await sock.sendMessage(jid, { text: `Daftar blokir (${list.length} entri):\n${list.join('\n') || 'kosong'}` })
                } else if (text === '!block') {
                    await sock.updateBlockStatus(jid, 'block')
                    await sock.sendMessage(jid, { text: `${jid} telah diblokir.` })
                } else if (text === '!unblock') {
                    await sock.updateBlockStatus(jid, 'unblock')
                    await sock.sendMessage(jid, { text: `${jid} telah dibuka blokirnya.` })
                } else if (text === '!setname') {
                    await sock.updateProfileName('Yebail Bot 🤖')
                    await sock.sendMessage(jid, { text: 'Nama profil diperbarui!' })
                } else if (text === '!setstatus') {
                    await sock.updateProfileStatus('Running on @yemo-dev/yebail 🚀')
                    await sock.sendMessage(jid, { text: 'Status profil diperbarui!' })
                } else if (text === '!privacy') {
                    await sock.updateLastSeenPrivacy('contacts')
                    await sock.updateOnlinePrivacy('match_last_seen')
                    await sock.updateProfilePicturePrivacy('contacts')
                    await sock.updateStatusPrivacy('contacts')
                    await sock.updateReadReceiptsPrivacy('all')
                    await sock.updateGroupsAddPrivacy('contacts')
                    await sock.sendMessage(jid, { text: 'Pengaturan privasi diperbarui ✅' })
                } else if (text === '!disappear') {
                    await sock.updateDefaultDisappearingMode(90 * 24 * 60 * 60)
                    await sock.sendMessage(jid, { text: 'Mode pesan hilang default diatur ke 90 hari' })
                } else if (text === '!creategroup') {
                    const group = await sock.groupCreate('Yebail Test Group', [jid])
                    await sock.sendMessage(jid, { text: `Grup dibuat! JID: ${group.id}` })
                } else if (text.startsWith('!invitelink ')) {
                    const groupJid = text.replace('!invitelink ', '').trim()
                    const code = await sock.groupInviteCode(groupJid)
                    await sock.sendMessage(jid, { text: `Link undangan: https://chat.whatsapp.com/${code}` })
                } else if (text.startsWith('!joingroup ')) {
                    const code = text.replace('!joingroup ', '').trim()
                    const groupJid = await sock.groupAcceptInvite(code)
                    await sock.sendMessage(jid, { text: `Bergabung ke grup: ${groupJid}` })
                } else if (text.startsWith('!groupinfo ')) {
                    const groupJid = text.replace('!groupinfo ', '').trim()
                    const meta = await sock.groupMetadata(groupJid)
                    await sock.sendMessage(jid, {
                        text: [
                            `📋 *Info Grup*`,
                            `Nama: ${meta.subject}`,
                            `ID: ${meta.id}`,
                            `Anggota: ${meta.size || meta.participants.length}`,
                            `Deskripsi: ${meta.desc || 'tidak ada'}`,
                            `Owner: ${meta.owner}`,
                        ].join('\n'),
                    })
                } else if (text.startsWith('!addmember ')) {
                    const [groupJid, memberJid] = text.replace('!addmember ', '').split(' ')
                    const result = await sock.groupParticipantsUpdate(groupJid, [memberJid], 'add')
                    await sock.sendMessage(jid, { text: JSON.stringify(result) })
                } else if (text.startsWith('!removemember ')) {
                    const [groupJid, memberJid] = text.replace('!removemember ', '').split(' ')
                    const result = await sock.groupParticipantsUpdate(groupJid, [memberJid], 'remove')
                    await sock.sendMessage(jid, { text: JSON.stringify(result) })
                } else if (text.startsWith('!promote ')) {
                    const [groupJid, memberJid] = text.replace('!promote ', '').split(' ')
                    await sock.groupParticipantsUpdate(groupJid, [memberJid], 'promote')
                    await sock.sendMessage(jid, { text: `${memberJid} dipromosikan jadi admin di ${groupJid}` })
                } else if (text.startsWith('!demote ')) {
                    const [groupJid, memberJid] = text.replace('!demote ', '').split(' ')
                    await sock.groupParticipantsUpdate(groupJid, [memberJid], 'demote')
                    await sock.sendMessage(jid, { text: `${memberJid} diturunkan di ${groupJid}` })
                } else if (text.startsWith('!ephemeral ')) {
                    const groupJid = text.replace('!ephemeral ', '').trim()
                    await sock.groupToggleEphemeral(groupJid, 604800)
                    await sock.sendMessage(jid, { text: 'Pesan hilang aktif (7 hari)' })
                } else if (text === '!groups') {
                    const groups = await sock.groupFetchAllParticipating()
                    const names = Object.values(groups).map(g => `• ${g.subject} (${g.id})`).join('\n')
                    await sock.sendMessage(jid, { text: `Grup (${Object.keys(groups).length}):\n${names}` })
                } else if (text.startsWith('!joinrequests ')) {
                    const groupJid = text.replace('!joinrequests ', '').trim()
                    const reqs = await sock.groupRequestParticipantsList(groupJid)
                    await sock.sendMessage(jid, { text: `Permintaan bergabung: ${JSON.stringify(reqs)}` })
                } else if (text.startsWith('!approve ')) {
                    const [groupJid, memberJid] = text.replace('!approve ', '').split(' ')
                    await sock.groupRequestParticipantsUpdate(groupJid, [memberJid], 'approve')
                    await sock.sendMessage(jid, { text: `${memberJid} diterima.` })
                } else if (text === '!createnewsletter') {
                    const nl = await sock.newsletterCreate('Yebail News', 'Update resmi Yebail')
                    await sock.sendMessage(jid, { text: `Newsletter dibuat: ${nl.id}` })
                } else if (text.startsWith('!follow ')) {
                    const nlJid = text.replace('!follow ', '').trim()
                    await sock.newsletterFollow(nlJid)
                    await sock.sendMessage(jid, { text: `Mengikuti ${nlJid}` })
                } else if (text.startsWith('!unfollow ')) {
                    const nlJid = text.replace('!unfollow ', '').trim()
                    await sock.newsletterUnfollow(nlJid)
                    await sock.sendMessage(jid, { text: `Berhenti mengikuti ${nlJid}` })
                } else if (text.startsWith('!mutenl ')) {
                    const nlJid = text.replace('!mutenl ', '').trim()
                    await sock.newsletterMute(nlJid)
                    await sock.sendMessage(jid, { text: `Newsletter ${nlJid} dibisukan` })
                } else if (text.startsWith('!nlinfo ')) {
                    const nlJid = text.replace('!nlinfo ', '').trim()
                    const meta = await sock.newsletterMetadata('JID', nlJid)
                    await sock.sendMessage(jid, {
                        text: [
                            `📰 *Info Newsletter*`,
                            `Nama: ${meta.name}`,
                            `ID: ${meta.id}`,
                            `Subscriber: ${meta.subscribers}`,
                            `Deskripsi: ${meta.description}`,
                            `Verifikasi: ${meta.verification}`,
                        ].join('\n'),
                    })
                } else if (text.startsWith('!nlreact ')) {
                    const parts = text.replace('!nlreact ', '').split(' ')
                    const [nlJid, serverId, emoji] = parts
                    await sock.newsletterReactMessage(nlJid, serverId, emoji)
                    await sock.sendMessage(jid, { text: `Reaksi dengan ${emoji}` })
                } else if (text === '!bots') {
                    const bots = await sock.getBotListV2()
                    await sock.sendMessage(jid, { text: `Bot tersedia: ${JSON.stringify(bots)}` })
                } else if (text === '!community') {
                    const community = await sock.communityCreate('Yebail Community', 'Selamat datang di komunitas Yebail!')
                    if (community?.value) {
                        await sock.sendMessage(jid, { text: `Komunitas dibuat: ${community.value.id}` })
                    } else {
                        await sock.sendMessage(jid, { text: 'Komunitas berhasil dibuat (cek WhatsApp kamu).' })
                    }
                } else if (text === '!calllink') {
                    const token = await sock.createCallLink('video')
                    await sock.sendMessage(jid, { text: `Token link panggilan: ${token}` })
                } else if (text === '!typing') {
                    await sock.sendPresenceUpdate('composing', jid)
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.sendPresenceUpdate('paused', jid)
                    await sock.sendMessage(jid, { text: 'Selesai mensimulasikan ketikan.' })
                } else if (text === '!subscribe') {
                    await sock.presenceSubscribe(jid)
                    await sock.sendMessage(jid, { text: `Berlangganan pembaruan presence untuk ${jid}` })
                } else if (text === '!labellist') {
                    const labels = await sock.getLabels()
                    const lines = labels.map(l => `• ${l.name} (id: ${l.id})`).join('\n')
                    await sock.sendMessage(jid, { text: `Label (${labels.length}):\n${lines || 'Belum ada label'}` })
                } else if (text.startsWith('!labelchat ')) {
                    const labelId = text.replace('!labelchat ', '').trim()
                    await sock.addChatLabel(jid, labelId)
                    await sock.sendMessage(jid, { text: `Label ${labelId} ditambahkan ke chat ini.` })
                } else if (text === '!help') {
                    await sock.sendMessage(jid, {
                        text: [
                            '*📖 Yebail Bot — Daftar Perintah*',
                            '',
                            '*Pesan*',
                            '!ping, !link, !mention, !reply',
                            '!image, !imagefile, !video, !gif, !audio, !voice, !ptv',
                            '!doc, !sticker, !contact, !contacts',
                            '!location, !livelocation, !poll',
                            '!react, !unreact, !list, !buttons, !interactive, !quickreply',
                            '!pay, !viewonce, !album, !forward, !edit, !delete, !pin',
                            '',
                            '*Chat*',
                            '!markunread, !archive, !mute, !deletechat, !star',
                            '!labellist, !labelchat <labelId>',
                            '',
                            '*Profil & Privasi*',
                            '!pfp, !exists, !status, !mystatus',
                            '!setname, !setstatus, !privacy, !disappear',
                            '',
                            '*Blokir*',
                            '!blocklist, !block, !unblock',
                            '',
                            '*Grup*',
                            '!creategroup, !invitelink <jid>, !joingroup <kode>',
                            '!groupinfo <jid>, !addmember <gjid> <mjid>',
                            '!removemember <gjid> <mjid>, !promote <gjid> <mjid>',
                            '!demote <gjid> <mjid>, !ephemeral <jid>',
                            '!groups, !joinrequests <jid>, !approve <gjid> <mjid>',
                            '',
                            '*Newsletter*',
                            '!createnewsletter, !follow <jid>, !unfollow <jid>',
                            '!mutenl <jid>, !nlinfo <jid>',
                            '!nlreact <jid> <server_id> <emoji>',
                            '',
                            '*Lainnya*',
                            '!bots, !community, !calllink',
                            '!typing, !subscribe, !download',
                            '!help',
                        ].join('\n'),
                    })
                }

                await sock.sendPresenceUpdate('paused', jid)
            }
        }
    })

    return sock
}

startSock().catch(console.error)

