const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestWaWebVersion } = require('../lib')
const P = require('pino')
const { Boom } = require('@hapi/boom')

const logger = P({ level: 'debug' })

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.process(async (events) => {
        if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect } = update
            if (connection === 'close') {
                if ((lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true) {
                    startSock()
                } else {
                    console.log('Connection closed. You are logged out.')
                }
            }
            if (connection === 'open') {
                console.log('opened connection')

                // Example: Send Status with Mention
                // This will trigger a private notification to the user
                // await sock.sendStatusMentions({ text: 'Hello from Yebail!' }, ['628xxx@s.whatsapp.net'])

                // Example: Send Album
                /* 
                await sock.sendAlbumMessage('628xxx@s.whatsapp.net', [
                    { image: { url: 'https://example.com/1.jpg' }, caption: 'Image 1' },
                    { video: { url: 'https://example.com/2.mp4' }, caption: 'Video 2' }
                ])
                */
            }
            console.log('connection update', update)
        }

        if (events['creds.update']) {
            await saveCreds()
        }

        if (events['messages.upsert']) {
            const upsert = events['messages.upsert']
            console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
            if (upsert.type === 'notify') {
                for (const msg of upsert.messages) {
                    if (!msg.key.fromMe) {
                        console.log('replying to', msg.key.remoteJid)
                        await sock.sendMessage(msg.key.remoteJid, { text: 'Hello there!' })
                    }
                }
            }
        }
    })
}

startSock()
