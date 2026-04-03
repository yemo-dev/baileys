/**
 * @yemo-dev/yebail — Contoh Bot WhatsApp
 *
 * Instalasi:
 *   npm install
 *
 * Menjalankan:
 *   node index.js
 *
 *   Pertama kali berjalan, bot akan meminta nomor HP untuk pairing code.
 *   Masukkan nomor HP format internasional tanpa '+' (contoh: 628123456789).
 *   Lalu masukkan kode yang muncul di terminal ke WhatsApp kamu:
 *   WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon.
 *
 * Kirim .menu ke bot untuk melihat semua perintah yang tersedia.
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
} = require('@yemo-dev/yebail')

const P = require('pino')
const { Boom } = require('@hapi/boom')
const { NodeCache } = require('@cacheable/node-cache')
const Jimp = require('jimp')
const readline = require('readline')

const logger = P({ level: 'silent' })

const store = makeInMemoryStore({ logger })
store.readFromFile('./yebail_store.json')
setInterval(() => store.writeToFile('./yebail_store.json'), 10_000)

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

function getMessageText(msg) {
    const content = msg?.message
    if (!content) return ''
    const type = getContentType(content)
    if (!type) return ''
    return (
        content[type]?.text ||
        content[type]?.caption ||
        content?.conversation ||
        ''
    )
}

function tanyaNomor(pertanyaan) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise(resolve => rl.question(pertanyaan, ans => { rl.close(); resolve(ans.trim()) }))
}

const MENU_SECTIONS = [
    {
        title: '💬 Pesan',
        rows: [
            { title: '.ping', description: 'Cek apakah bot aktif', rowId: '.ping' },
            { title: '.menu', description: 'Tampilkan daftar perintah ini', rowId: '.menu' },
            { title: '.link', description: 'Kirim link dengan pratinjau', rowId: '.link' },
            { title: '.mention', description: 'Mention pengirim', rowId: '.mention' },
            { title: '.reply', description: 'Balas pesan dengan kutipan', rowId: '.reply' },
            { title: '.sticker', description: 'Kirim stiker', rowId: '.sticker' },
            { title: '.react', description: 'Kirim reaksi', rowId: '.react' },
            { title: '.unreact', description: 'Hapus reaksi', rowId: '.unreact' },
        ],
    },
    {
        title: '🖼️ Media',
        rows: [
            { title: '.image', description: 'Kirim gambar dari URL', rowId: '.image' },
            { title: '.video', description: 'Kirim video dari URL', rowId: '.video' },
            { title: '.gif', description: 'Kirim GIF', rowId: '.gif' },
            { title: '.audio', description: 'Kirim audio', rowId: '.audio' },
            { title: '.voice', description: 'Kirim pesan suara (PTT)', rowId: '.voice' },
            { title: '.ptv', description: 'Kirim video lingkaran (PTV)', rowId: '.ptv' },
            { title: '.doc', description: 'Kirim dokumen PDF', rowId: '.doc' },
            { title: '.viewonce', description: 'Kirim gambar sekali lihat', rowId: '.viewonce' },
            { title: '.album', description: 'Kirim album foto', rowId: '.album' },
            { title: '.download', description: 'Unduh media terakhir di chat', rowId: '.download' },
            { title: '.grayscale', description: 'Ubah gambar terakhir ke hitam putih', rowId: '.grayscale' },
            { title: '.resize', description: 'Resize gambar terakhir ke lebar 512px', rowId: '.resize' },
            { title: '.thumbnail', description: 'Buat thumbnail 200x200 dari gambar terakhir', rowId: '.thumbnail' },
        ],
    },
    {
        title: '📋 Interaktif',
        rows: [
            { title: '.list', description: 'Contoh pesan list', rowId: '.list' },
            { title: '.buttons', description: 'Contoh pesan tombol', rowId: '.buttons' },
            { title: '.interactive', description: 'Contoh native flow', rowId: '.interactive' },
            { title: '.quickreply', description: 'Contoh quick reply', rowId: '.quickreply' },
            { title: '.poll', description: 'Buat polling', rowId: '.poll' },
        ],
    },
    {
        title: '📌 Chat & Pesan',
        rows: [
            { title: '.edit', description: 'Edit pesan yang terkirim', rowId: '.edit' },
            { title: '.delete', description: 'Hapus pesan untuk semua', rowId: '.delete' },
            { title: '.pin', description: 'Sematkan pesan', rowId: '.pin' },
            { title: '.forward', description: 'Forward pesan terakhir', rowId: '.forward' },
            { title: '.markunread', description: 'Tandai chat belum dibaca', rowId: '.markunread' },
            { title: '.archive', description: 'Arsipkan chat', rowId: '.archive' },
            { title: '.mute', description: 'Bisukan chat 8 jam', rowId: '.mute' },
            { title: '.star', description: 'Bintangi pesan', rowId: '.star' },
        ],
    },
    {
        title: '👤 Profil & Privasi',
        rows: [
            { title: '.pfp', description: 'Ambil foto profil', rowId: '.pfp' },
            { title: '.exists', description: 'Cek nomor di WhatsApp', rowId: '.exists' },
            { title: '.status', description: 'Cek teks status', rowId: '.status' },
            { title: '.mystatus', description: 'Posting status dengan mention', rowId: '.mystatus' },
            { title: '.setname', description: 'Ubah nama profil bot', rowId: '.setname' },
            { title: '.setstatus', description: 'Ubah status profil bot', rowId: '.setstatus' },
            { title: '.privacy', description: 'Perbarui pengaturan privasi', rowId: '.privacy' },
            { title: '.disappear', description: 'Aktifkan pesan hilang 90 hari', rowId: '.disappear' },
        ],
    },
    {
        title: '🚫 Blokir',
        rows: [
            { title: '.blocklist', description: 'Lihat daftar blokir', rowId: '.blocklist' },
            { title: '.block', description: 'Blokir pengirim', rowId: '.block' },
            { title: '.unblock', description: 'Buka blokir pengirim', rowId: '.unblock' },
        ],
    },
    {
        title: '👥 Grup',
        rows: [
            { title: '.creategroup', description: 'Buat grup baru', rowId: '.creategroup' },
            { title: '.groups', description: 'Lihat semua grup', rowId: '.groups' },
            { title: '.invitelink <jid>', description: 'Dapatkan link undangan', rowId: '.invitelink' },
            { title: '.joingroup <kode>', description: 'Bergabung dengan kode', rowId: '.joingroup' },
            { title: '.groupinfo <jid>', description: 'Info grup', rowId: '.groupinfo' },
        ],
    },
    {
        title: '📰 Newsletter & Lainnya',
        rows: [
            { title: '.createnewsletter', description: 'Buat newsletter', rowId: '.createnewsletter' },
            { title: '.community', description: 'Buat komunitas', rowId: '.community' },
            { title: '.bots', description: 'Daftar bot WhatsApp', rowId: '.bots' },
            { title: '.calllink', description: 'Buat link panggilan video', rowId: '.calllink' },
            { title: '.typing', description: 'Simulasikan status mengetik', rowId: '.typing' },
            { title: '.pay', description: 'Kirim permintaan pembayaran', rowId: '.pay' },
            { title: '.contact', description: 'Kirim kartu kontak', rowId: '.contact' },
            { title: '.location', description: 'Kirim lokasi', rowId: '.location' },
        ],
    },
]

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('yebail_auth')

    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`[Yebail] Menggunakan WA v${version.join('.')}, terbaru: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        browser: ['Windows', 'Chrome', '10.0'],
        printQRInTerminal: false,
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

    if (!sock.authState.creds.registered) {
        const nomor = await tanyaNomor(
            '[Yebail] Masukkan nomor HP (format internasional, tanpa +, contoh 628123456789): '
        )
        const code = await sock.requestPairingCode(nomor)
        console.log(`[Yebail] Pairing code kamu: ${code}`)
        console.log('[Yebail] Buka WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon → masukkan kode di atas.')
    }

    sock.ev.process(async (events) => {

        if (events['connection.update']) {
            const { connection, lastDisconnect } = events['connection.update']
            if (connection === 'close') {
                const shouldReconnect =
                    lastDisconnect?.error instanceof Boom
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                        : true
                console.log('[Yebail] Koneksi terputus. Menghubungkan ulang:', shouldReconnect)
                if (shouldReconnect) startSock()
            } else if (connection === 'open') {
                console.log('[Yebail] ✅ Terhubung ke WhatsApp!')
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
                        console.log('[Yebail] Hasil poll:', votes)
                    }
                }
            }
        }

        if (events['messages.reaction']) {
            for (const reaction of events['messages.reaction']) {
                console.log(`[Yebail] Reaksi dari ${reaction.key.remoteJid}: ${reaction.reaction?.text || '(dihapus)'}`)
            }
        }

        if (events['call']) {
            for (const call of events['call']) {
                console.log(`[Yebail] Panggilan masuk dari ${call.from} — status: ${call.status}`)
                if (call.status === 'offer') {
                    await sock.rejectCall(call.id, call.from)
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

                console.log(`[Yebail] [${jid}] ${rawText}`)

                await sock.readMessages([msg.key])
                await sock.sendPresenceUpdate('composing', jid)

                if (text === '.menu') {
                    await sock.sendMessage(jid, {
                        text: 'Pilih kategori perintah yang ingin kamu gunakan:',
                        title: '🤖 *Yebail Bot*',
                        footer: 'Powered by @yemo-dev/yebail',
                        buttonText: '📋 Buka Menu',
                        sections: MENU_SECTIONS,
                    })
                } else if (text === '.ping') {
                    await sock.sendMessage(jid, { text: '🏓 Pong! Bot aktif.' })
                } else if (text === '.link') {
                    await sock.sendMessage(jid, {
                        text: 'Cek repositori Yebail: https://github.com/yemo-dev/baileys',
                    })
                } else if (text === '.mention') {
                    await sock.sendMessage(jid, {
                        text: `Halo @${jid.split('@')[0]}! 👋`,
                        mentions: [jid],
                    })
                } else if (text === '.reply') {
                    await sock.sendMessage(jid, { text: 'Ini adalah balasan terkutip! 💬' }, { quoted: msg })
                } else if (text === '.image') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/800/600' },
                        caption: '🌄 Gambar acak dari picsum.photos',
                    })
                } else if (text === '.video') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        caption: '🎬 Contoh video',
                    })
                } else if (text === '.gif') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4' },
                        gifPlayback: true,
                        caption: '🎞️ GIF!',
                    })
                } else if (text === '.audio') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/mp4',
                    })
                } else if (text === '.voice') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                    })
                } else if (text === '.ptv') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        ptv: true,
                    })
                } else if (text === '.doc') {
                    await sock.sendMessage(jid, {
                        document: { url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf' },
                        mimetype: 'application/pdf',
                        fileName: 'contoh.pdf',
                        caption: '📄 Contoh dokumen PDF',
                    })
                } else if (text === '.sticker') {
                    await sock.sendMessage(jid, {
                        sticker: { url: 'https://www.gstatic.com/webp/gallery/1.webp' },
                    })
                } else if (text === '.contact') {
                    await sock.sendMessage(jid, {
                        contacts: {
                            displayName: 'Yebail Bot',
                            contacts: [{
                                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Yebail Bot\nTEL;type=CELL;type=VOICE;waid=628000000000:+62 800-0000-0000\nEND:VCARD`,
                            }],
                        },
                    })
                } else if (text === '.location') {
                    await sock.sendMessage(jid, {
                        location: {
                            degreesLatitude: -6.2088,
                            degreesLongitude: 106.8456,
                            name: 'Jakarta, Indonesia',
                            address: 'DKI Jakarta, Indonesia',
                        },
                    })
                } else if (text === '.poll') {
                    await sock.sendMessage(jid, {
                        poll: {
                            name: '🍉 Buah favorit kamu?',
                            values: ['🍎 Apel', '🍌 Pisang', '🍇 Anggur', '🍓 Stroberi'],
                            selectableCount: 1,
                        },
                    })
                } else if (text === '.react') {
                    await sock.sendMessage(jid, { react: { text: '❤️', key: msg.key } })
                } else if (text === '.unreact') {
                    await sock.sendMessage(jid, { react: { text: '', key: msg.key } })
                } else if (text === '.list') {
                    await sock.sendMessage(jid, {
                        listMessage: {
                            title: '🍕 Pilih Menu Makanan',
                            text: 'Pilih salah satu pilihan di bawah ini:',
                            footerText: 'Powered by Yebail',
                            buttonText: '🔽 Buka Daftar',
                            listType: 1,
                            sections: [
                                {
                                    title: '🍔 Makanan',
                                    rows: [
                                        { title: 'Pizza', description: 'Keju & tomat segar', rowId: 'pizza' },
                                        { title: 'Burger', description: 'Daging sapi pilihan', rowId: 'burger' },
                                        { title: 'Nasi Goreng', description: 'Khas Indonesia', rowId: 'nasigoreng' },
                                    ],
                                },
                                {
                                    title: '🥤 Minuman',
                                    rows: [
                                        { title: 'Cola', description: 'Segar & dingin', rowId: 'cola' },
                                        { title: 'Jus Jeruk', description: 'Buah segar', rowId: 'juice' },
                                        { title: 'Teh Tarik', description: 'Khas Malaysia', rowId: 'teh' },
                                    ],
                                },
                            ],
                        },
                    })
                } else if (text === '.buttons') {
                    await sock.sendMessage(jid, {
                        buttonsMessage: {
                            text: 'Pilih salah satu opsi di bawah ini:',
                            footerText: 'Yebail Bot',
                            headerType: 1,
                            buttons: [
                                { buttonId: 'btn1', buttonText: { displayText: '✅ Setuju' }, type: 1 },
                                { buttonId: 'btn2', buttonText: { displayText: '❌ Tidak Setuju' }, type: 1 },
                                { buttonId: 'btn3', buttonText: { displayText: '🤔 Mungkin' }, type: 1 },
                            ],
                        },
                    })
                } else if (text === '.interactive') {
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
                } else if (text === '.quickreply') {
                    await sock.sendMessage(jid, {
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
                } else if (text === '.viewonce') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/400/400' },
                        caption: '👁️ Hanya bisa dilihat sekali!',
                        viewOnce: true,
                    })
                } else if (text === '.album') {
                    await sock.sendAlbumMessage(jid, [
                        { image: { url: 'https://picsum.photos/800/600?random=1' }, caption: '📸 Foto 1' },
                        { image: { url: 'https://picsum.photos/800/600?random=2' }, caption: '📸 Foto 2' },
                        { image: { url: 'https://picsum.photos/800/600?random=3' }, caption: '📸 Foto 3' },
                    ])
                } else if (text === '.forward') {
                    await sock.sendMessage(jid, { forward: msg, force: true })
                } else if (text === '.edit') {
                    const sent = await sock.sendMessage(jid, { text: '✏️ Pesan asli...' })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.sendMessage(jid, { text: '✅ Pesan sudah diedit!', edit: sent.key })
                } else if (text === '.delete') {
                    const sent = await sock.sendMessage(jid, { text: '🗑️ Pesan ini akan dihapus dalam 3 detik...' })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.sendMessage(jid, { delete: sent.key })
                } else if (text === '.pin') {
                    const sent = await sock.sendMessage(jid, { text: '📌 Pesan disematkan!' })
                    await sock.sendMessage(jid, { pin: sent.key, type: 1 })
                } else if (text === '.markunread') {
                    await sock.chatModify(
                        { markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
                        jid
                    )
                } else if (text === '.archive') {
                    await sock.chatModify(
                        { archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
                        jid
                    )
                    await sock.sendMessage(jid, { text: '📦 Chat berhasil diarsipkan.' })
                } else if (text === '.mute') {
                    const muteUntil = Date.now() + 8 * 60 * 60 * 1000
                    await sock.chatModify({ mute: muteUntil }, jid)
                    await sock.sendMessage(jid, { text: '🔇 Chat dibisukan selama 8 jam.' })
                } else if (text === '.star') {
                    await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)
                    await sock.sendMessage(jid, { text: '⭐ Pesan diberi bintang.' })
                } else if (text === '.pfp') {
                    const url = await sock.profilePictureUrl(jid, 'image').catch(() => null)
                    await sock.sendMessage(jid, {
                        text: url ? `🖼️ Foto profil: ${url}` : '❌ Tidak ada foto profil.',
                    })
                } else if (text === '.exists') {
                    const [result] = (await sock.onWhatsApp(jid)) || []
                    await sock.sendMessage(jid, {
                        text: result?.exists
                            ? `✅ ${jid} terdaftar di WhatsApp (LID: ${result.lid || 'n/a'})`
                            : `❌ Nomor tidak ditemukan di WhatsApp.`,
                    })
                } else if (text === '.status') {
                    const statuses = await sock.fetchStatus(jid).catch(() => [])
                    const s = statuses?.[0]?.status || 'Belum ada status'
                    await sock.sendMessage(jid, { text: `ℹ️ Status: ${s}` })
                } else if (text === '.download') {
                    const chatMsgs = store.messages[jid]?.array || []
                    const mediaMsg = [...chatMsgs].reverse().find(m => {
                        const c = m.message
                        if (!c) return false
                        const t = getContentType(c)
                        return ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(t)
                    })
                    if (mediaMsg) {
                        const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {})
                        await sock.sendMessage(jid, { text: `✅ Unduhan berhasil: ${buffer.length} bytes` })
                    } else {
                        await sock.sendMessage(jid, { text: '❌ Tidak ada media yang bisa diunduh di chat ini.' })
                    }
                } else if (text === '.grayscale' || text === '.resize' || text === '.thumbnail') {
                    const chatMsgs = store.messages[jid]?.array || []
                    const imgMsg = [...chatMsgs].reverse().find(m => {
                        const c = m.message
                        if (!c) return false
                        return getContentType(c) === 'imageMessage'
                    })
                    if (!imgMsg) {
                        await sock.sendMessage(jid, { text: '❌ Tidak ada gambar di chat ini untuk diproses.' })
                    } else {
                        try {
                            const buffer = await downloadMediaMessage(imgMsg, 'buffer', {})
                            const image = await Jimp.read(buffer)
                            const MIME_JPEG = Jimp.MIME_JPEG || 'image/jpeg'
                            const jimpAuto = Jimp.AUTO != null ? Jimp.AUTO : -1
                            const getBuffer = (img) => typeof img.getBufferAsync === 'function'
                                ? img.getBufferAsync(MIME_JPEG)
                                : img.getBuffer(MIME_JPEG)
                            if (text === '.grayscale') {
                                image.grayscale()
                                const out = await getBuffer(image)
                                await sock.sendMessage(jid, { image: out, caption: '🖤 Gambar hitam putih' })
                            } else if (text === '.resize') {
                                image.resize(512, jimpAuto)
                                const out = await getBuffer(image)
                                await sock.sendMessage(jid, { image: out, caption: '📐 Gambar di-resize ke lebar 512px' })
                            } else if (text === '.thumbnail') {
                                image.cover(200, 200)
                                const out = await getBuffer(image)
                                await sock.sendMessage(jid, { image: out, caption: '🖼️ Thumbnail 200×200' })
                            }
                        } catch (err) {
                            console.error('[Yebail] Jimp error:', err)
                            await sock.sendMessage(jid, { text: '❌ Gagal memproses gambar. Pastikan format gambar valid.' })
                        }
                    }
                } else if (text === '.mystatus') {
                    await sock.sendStatusMentions(
                        { text: '🚀 Powered by @yemo-dev/yebail!' },
                        [jid]
                    )
                    await sock.sendMessage(jid, { text: '✅ Status berhasil diposting dengan mention kamu!' })
                } else if (text === '.blocklist') {
                    const list = await sock.fetchBlocklist()
                    await sock.sendMessage(jid, {
                        text: `🚫 Daftar blokir (${list.length} entri):\n${list.join('\n') || '(kosong)'}`,
                    })
                } else if (text === '.block') {
                    await sock.updateBlockStatus(jid, 'block')
                    await sock.sendMessage(jid, { text: `🚫 ${jid} telah diblokir.` })
                } else if (text === '.unblock') {
                    await sock.updateBlockStatus(jid, 'unblock')
                    await sock.sendMessage(jid, { text: `✅ Blokir untuk ${jid} telah dicabut.` })
                } else if (text === '.setname') {
                    await sock.updateProfileName('Yebail Bot 🤖')
                    await sock.sendMessage(jid, { text: '✅ Nama profil berhasil diperbarui!' })
                } else if (text === '.setstatus') {
                    await sock.updateProfileStatus('🚀 Running on @yemo-dev/yebail')
                    await sock.sendMessage(jid, { text: '✅ Status profil berhasil diperbarui!' })
                } else if (text === '.privacy') {
                    await sock.updateLastSeenPrivacy('contacts')
                    await sock.updateOnlinePrivacy('match_last_seen')
                    await sock.updateProfilePicturePrivacy('contacts')
                    await sock.updateStatusPrivacy('contacts')
                    await sock.updateReadReceiptsPrivacy('all')
                    await sock.updateGroupsAddPrivacy('contacts')
                    await sock.sendMessage(jid, { text: '✅ Pengaturan privasi berhasil diperbarui.' })
                } else if (text === '.disappear') {
                    await sock.updateDefaultDisappearingMode(90 * 24 * 60 * 60)
                    await sock.sendMessage(jid, { text: '✅ Mode pesan hilang default diatur ke 90 hari.' })
                } else if (text === '.creategroup') {
                    const group = await sock.groupCreate('Yebail Test Group', [jid])
                    await sock.sendMessage(jid, { text: `✅ Grup dibuat! JID: ${group.id}` })
                } else if (text.startsWith('.invitelink ')) {
                    const groupJid = text.replace('.invitelink ', '').trim()
                    const code = await sock.groupInviteCode(groupJid)
                    await sock.sendMessage(jid, { text: `🔗 Link undangan: https://chat.whatsapp.com/${code}` })
                } else if (text.startsWith('.joingroup ')) {
                    const code = text.replace('.joingroup ', '').trim()
                    const groupJid = await sock.groupAcceptInvite(code)
                    await sock.sendMessage(jid, { text: `✅ Bergabung ke grup: ${groupJid}` })
                } else if (text.startsWith('.groupinfo ')) {
                    const groupJid = text.replace('.groupinfo ', '').trim()
                    const meta = await sock.groupMetadata(groupJid)
                    await sock.sendMessage(jid, {
                        text: [
                            `📋 *Info Grup*`,
                            `• Nama: ${meta.subject}`,
                            `• ID: ${meta.id}`,
                            `• Anggota: ${meta.size || meta.participants.length}`,
                            `• Deskripsi: ${meta.desc || '(tidak ada)'}`,
                            `• Owner: ${meta.owner}`,
                        ].join('\n'),
                    })
                } else if (text === '.groups') {
                    const groups = await sock.groupFetchAllParticipating()
                    const names = Object.values(groups).map(g => `• ${g.subject} (${g.id})`).join('\n')
                    await sock.sendMessage(jid, { text: `👥 Grup (${Object.keys(groups).length}):\n${names || '(tidak ada)'}` })
                } else if (text === '.createnewsletter') {
                    const nl = await sock.newsletterCreate('Yebail News', 'Update resmi Yebail')
                    await sock.sendMessage(jid, { text: `✅ Newsletter dibuat: ${nl.id}` })
                } else if (text === '.community') {
                    const community = await sock.communityCreate('Yebail Community', 'Selamat datang di komunitas Yebail!')
                    const communityId = community?.value?.id || '(cek WhatsApp kamu)'
                    await sock.sendMessage(jid, { text: `✅ Komunitas dibuat: ${communityId}` })
                } else if (text === '.bots') {
                    const bots = await sock.getBotListV2()
                    await sock.sendMessage(jid, { text: `🤖 Bot tersedia:\n${JSON.stringify(bots, null, 2)}` })
                } else if (text === '.calllink') {
                    const token = await sock.createCallLink('video')
                    await sock.sendMessage(jid, { text: `📹 Token link panggilan: ${token}` })
                } else if (text === '.typing') {
                    await sock.sendPresenceUpdate('composing', jid)
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.sendPresenceUpdate('paused', jid)
                    await sock.sendMessage(jid, { text: '✅ Simulasi mengetik selesai.' })
                } else if (text === '.pay') {
                    await sock.sendMessage(jid, {
                        requestPaymentMessage: {
                            currencyCodeIso4217: 'IDR',
                            amount1000: 50000 * 1000,
                            requestFrom: sock.authState.creds.me.id,
                            noteMessage: {
                                extendedTextMessage: {
                                    text: '💰 Pembayaran untuk layanan bot',
                                },
                            },
                        },
                    })
                }

                await sock.sendPresenceUpdate('paused', jid)
            }
        }
    })

    return sock
}

startSock().catch(console.error)
