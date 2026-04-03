/**
 * @yemo-dev/yebail — Comprehensive Example Bot
 *
 * Covers:
 *  - Connection (QR + Pairing Code)
 *  - Auth state persistence
 *  - In-memory store
 *  - Group metadata caching
 *  - All major sendMessage content types (text, image, video, audio, document,
 *    sticker, contact, location, live-location, link-preview, poll, reaction,
 *    list, buttons, native-flow/interactive, carousel, album, forward, edit,
 *    delete, pin, view-once, PTT, PTV, payment-request)
 *  - Status / Story sending with mentions
 *  - Album messages
 *  - Read receipts
 *  - Presence updates (typing, recording, online/offline)
 *  - Profile management (name, status text, picture, remove picture)
 *  - Privacy settings (last-seen, online, profile-pic, status, read-receipts,
 *    group-add, messages, calls, disappearing mode, link-previews)
 *  - Block / unblock
 *  - Blocklist fetch
 *  - Chat modification (archive, pin, mute, delete, mark-unread, star, labels)
 *  - Contact management (add/edit, remove)
 *  - Group management (create, leave, update name/description, participants,
 *    invite code, revoke, accept, approval mode, ephemeral, settings)
 *  - Newsletter management (create, follow, mute, react, fetch, update)
 *  - Community management (create, create group, link/unlink, participants)
 *  - Business profile update & cover photo
 *  - Poll vote decryption
 *  - Download received media
 *  - User lookup / fetchStatus
 *  - Bot list
 *  - Account restriction check
 *  - Custom websocket event handling
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
const path = require('path')

// ─── Logger ──────────────────────────────────────────────────────────────────
const logger = P({ level: 'silent' }) // change to 'debug' for verbose output

// ─── In-Memory Store ─────────────────────────────────────────────────────────
const store = makeInMemoryStore({ logger })
store.readFromFile('./baileys_store.json')
setInterval(() => store.writeToFile('./baileys_store.json'), 10_000)

// ─── Group Metadata Cache ────────────────────────────────────────────────────
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

// ─── Helper: get plain text from a received message ──────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
const startSock = async () => {
    // 1. Auth state (filesystem)
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

    // 2. Fetch latest WA Web version (keeps compatibility up to date)
    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)

    // 3. Create socket
    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        browser: Browsers.ubuntu('MyBot'),
        printQRInTerminal: true,       // set false when using pairing code
        markOnlineOnConnect: true,     // set false to keep phone notifications
        syncFullHistory: false,
        generateMessageID: undefined,  // leave undefined to use default 32-char hex
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || undefined
            }
            return { conversation: 'hello' }
        },
    })

    // 4. Bind store to socket events
    store.bind(sock.ev)

    // ── PAIRING CODE (alternative to QR scan) ────────────────────────────────
    // Uncomment the block below and set printQRInTerminal: false to use pairing code instead.
    /*
    if (!sock.authState.creds.registered) {
        const phoneNumber = '628xxxxxxxxx' // Your number with country code, no '+' or spaces
        const code = await sock.requestPairingCode(phoneNumber)
        console.log('Pairing code:', code)
    }
    */

    // ─── Event Processing ────────────────────────────────────────────────────
    sock.ev.process(async (events) => {

        // ── Connection update ──────────────────────────────────────────────
        if (events['connection.update']) {
            const { connection, lastDisconnect, qr } = events['connection.update']

            if (qr) {
                console.log('Scan QR code to login.')
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                        : true
                console.log('Connection closed. Reconnecting:', shouldReconnect)
                if (shouldReconnect) startSock()
            } else if (connection === 'open') {
                console.log('Connection opened!')
            }
        }

        // ── Save credentials whenever they change ──────────────────────────
        if (events['creds.update']) {
            await saveCreds()
        }

        // ── Update group cache when groups change ──────────────────────────
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

        // ── Poll vote decryption ───────────────────────────────────────────
        if (events['messages.update']) {
            for (const { key, update } of events['messages.update']) {
                if (update.pollUpdates) {
                    const pollCreation = await store.loadMessage(key.remoteJid, key.id)
                    if (pollCreation) {
                        const votes = getAggregateVotesInPollMessage({
                            message: pollCreation.message,
                            pollUpdates: update.pollUpdates,
                        })
                        console.log('Poll results:', votes)
                    }
                }
            }
        }

        // ── Incoming messages ──────────────────────────────────────────────
        if (events['messages.upsert']) {
            const { messages, type } = events['messages.upsert']
            if (type !== 'notify') return

            for (const msg of messages) {
                if (msg.key.fromMe) continue

                const jid = msg.key.remoteJid
                const text = getMessageText(msg).trim().toLowerCase()

                console.log(`[${jid}] ${text}`)

                // ── Mark as read ─────────────────────────────────────────
                await sock.readMessages([msg.key])

                // ── Typing indicator ─────────────────────────────────────
                await sock.sendPresenceUpdate('composing', jid)

                // ─────────────────────────────────────────────────────────
                // COMMAND ROUTER
                // Send any of these commands to the bot to demonstrate each
                // feature. All phone numbers below use a placeholder
                // (628xxx@s.whatsapp.net); replace with real JIDs when testing.
                // ─────────────────────────────────────────────────────────

                // ── 1. Plain text ────────────────────────────────────────
                if (text === '!ping') {
                    await sock.sendMessage(jid, { text: 'Pong! 🏓' })
                }

                // ── 2. Text with link preview ────────────────────────────
                else if (text === '!link') {
                    await sock.sendMessage(jid, {
                        text: 'Check out https://github.com/yemo-dev/baileys',
                    })
                }

                // ── 3. Mention users ─────────────────────────────────────
                else if (text === '!mention') {
                    await sock.sendMessage(jid, {
                        text: `Hello @${jid.split('@')[0]}!`,
                        mentions: [jid],
                    })
                }

                // ── 4. Reply / quote ─────────────────────────────────────
                else if (text === '!reply') {
                    await sock.sendMessage(jid, { text: 'This is a reply!' }, { quoted: msg })
                }

                // ── 5. Image (from URL) ──────────────────────────────────
                else if (text === '!image') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/800/600' },
                        caption: 'A beautiful random image 🌄',
                    })
                }

                // ── 6. Image (from file) ─────────────────────────────────
                else if (text === '!imagefile') {
                    // await sock.sendMessage(jid, {
                    //     image: fs.readFileSync('./assets/photo.jpg'),
                    //     caption: 'Image from file',
                    // })
                    await sock.sendMessage(jid, { text: 'Uncomment the imagefile example in example.js' })
                }

                // ── 7. Video ─────────────────────────────────────────────
                else if (text === '!video') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        caption: 'Sample video 🎬',
                    })
                }

                // ── 8. GIF (gifPlayback) ──────────────────────────────────
                else if (text === '!gif') {
                    await sock.sendMessage(jid, {
                        video: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4' },
                        gifPlayback: true,
                        caption: 'GIF! 🎞️',
                    })
                }

                // ── 9. Audio ─────────────────────────────────────────────
                else if (text === '!audio') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/mp4',
                    })
                }

                // ── 10. Voice note (PTT) ─────────────────────────────────
                else if (text === '!voice') {
                    await sock.sendMessage(jid, {
                        audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                    })
                }

                // ── 11. Document ─────────────────────────────────────────
                else if (text === '!doc') {
                    await sock.sendMessage(jid, {
                        document: { url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf' },
                        mimetype: 'application/pdf',
                        fileName: 'sample.pdf',
                        caption: 'Here is a PDF document 📄',
                    })
                }

                // ── 12. Sticker (from URL) ───────────────────────────────
                else if (text === '!sticker') {
                    await sock.sendMessage(jid, {
                        sticker: { url: 'https://www.gstatic.com/webp/gallery/1.webp' },
                    })
                }

                // ── 13. Contact card ─────────────────────────────────────
                else if (text === '!contact') {
                    await sock.sendMessage(jid, {
                        contacts: {
                            displayName: 'Yebail Bot',
                            contacts: [
                                {
                                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Yebail Bot\nTEL;type=CELL;type=VOICE;waid=628000000000:+62 800-0000-0000\nEND:VCARD`,
                                },
                            ],
                        },
                    })
                }

                // ── 14. Multiple contacts ────────────────────────────────
                else if (text === '!contacts') {
                    await sock.sendMessage(jid, {
                        contacts: {
                            displayName: 'Two Contacts',
                            contacts: [
                                { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Alice\nTEL;waid=628111111111:+62 811-1111-1111\nEND:VCARD` },
                                { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bob\nTEL;waid=628222222222:+62 822-2222-2222\nEND:VCARD` },
                            ],
                        },
                    })
                }

                // ── 15. Location ─────────────────────────────────────────
                else if (text === '!location') {
                    await sock.sendMessage(jid, {
                        location: {
                            degreesLatitude: -6.2088,
                            degreesLongitude: 106.8456,
                            name: 'Jakarta, Indonesia',
                            address: 'DKI Jakarta, Indonesia',
                        },
                    })
                }

                // ── 16. Live location (30 minutes) ───────────────────────
                else if (text === '!livelocation') {
                    await sock.sendMessage(jid, {
                        liveLocation: {
                            degreesLatitude: -6.2088,
                            degreesLongitude: 106.8456,
                            accuracyInMeters: 10,
                            speedInMps: 0,
                            degreesClockwiseFromMagneticNorth: 0,
                            caption: 'Sharing live location',
                            sequenceNumber: BigInt(Date.now()),
                            timeSinceLastUpdate: 0,
                        },
                        caption: 'Sharing live location for 30 minutes',
                    })
                }

                // ── 17. Poll ─────────────────────────────────────────────
                else if (text === '!poll') {
                    await sock.sendMessage(jid, {
                        poll: {
                            name: 'What is your favorite fruit?',
                            values: ['🍎 Apple', '🍌 Banana', '🍇 Grape', '🍓 Strawberry'],
                            selectableCount: 1,
                        },
                    })
                }

                // ── 18. Emoji reaction ───────────────────────────────────
                else if (text === '!react') {
                    await sock.sendMessage(jid, {
                        react: { text: '❤️', key: msg.key },
                    })
                }

                // ── 19. Remove reaction ──────────────────────────────────
                else if (text === '!unreact') {
                    await sock.sendMessage(jid, {
                        react: { text: '', key: msg.key }, // empty string removes reaction
                    })
                }

                // ── 20. List message ─────────────────────────────────────
                else if (text === '!list') {
                    await sock.sendMessage(jid, {
                        listMessage: {
                            title: '🍕 Choose your meal',
                            text: 'Select one of the options below:',
                            footerText: 'Powered by Yebail',
                            buttonText: 'Open Menu',
                            listType: 1,
                            sections: [
                                {
                                    title: 'Main Course',
                                    rows: [
                                        { title: 'Pizza', description: 'Cheese & tomato', rowId: 'pizza' },
                                        { title: 'Burger', description: 'Beef patty', rowId: 'burger' },
                                    ],
                                },
                                {
                                    title: 'Drinks',
                                    rows: [
                                        { title: 'Cola', description: 'Chilled', rowId: 'cola' },
                                        { title: 'Juice', description: 'Fresh orange', rowId: 'juice' },
                                    ],
                                },
                            ],
                        },
                    })
                }

                // ── 21. Buttons message ──────────────────────────────────
                else if (text === '!buttons') {
                    await sock.sendMessage(jid, {
                        buttonsMessage: {
                            text: 'Choose an option:',
                            footerText: 'Yebail Bot',
                            headerType: 1,
                            buttons: [
                                { buttonId: 'btn1', buttonText: { displayText: 'Option 1' }, type: 1 },
                                { buttonId: 'btn2', buttonText: { displayText: 'Option 2' }, type: 1 },
                                { buttonId: 'btn3', buttonText: { displayText: 'Option 3' }, type: 1 },
                            ],
                        },
                    })
                }

                // ── 22. Interactive (native flow) single-select ───────────
                else if (text === '!interactive') {
                    await sock.sendMessage(jid, {
                        interactiveMessage: {
                            header: {
                                title: '🎯 Select your plan',
                                hasMediaAttachment: false,
                            },
                            body: { text: 'Pick a subscription plan:' },
                            footer: { text: 'Yebail powered' },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: 'single_select',
                                        buttonParamsJson: JSON.stringify({
                                            title: 'Choose plan',
                                            sections: [
                                                {
                                                    title: 'Plans',
                                                    rows: [
                                                        { header: 'Basic', title: 'Basic – Free', description: 'Limited features', id: 'basic' },
                                                        { header: 'Pro', title: 'Pro – $9/mo', description: 'Full features', id: 'pro' },
                                                    ],
                                                },
                                            ],
                                        }),
                                    },
                                ],
                                messageParamsJson: '',
                            },
                        },
                    })
                }

                // ── 23. Interactive (native flow) quick reply ─────────────
                else if (text === '!quickreply') {
                    await sock.sendMessage(jid, {
                        interactiveMessage: {
                            header: { title: 'Quick reply', hasMediaAttachment: false },
                            body: { text: 'How are you feeling today?' },
                            footer: { text: 'Yebail' },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({ display_text: '😊 Good', id: 'good' }),
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({ display_text: '😔 Bad', id: 'bad' }),
                                    },
                                ],
                                messageParamsJson: '',
                            },
                        },
                    })
                }

                // ── 24. Payment request ──────────────────────────────────
                else if (text === '!pay') {
                    await sock.sendMessage(jid, {
                        requestPaymentMessage: {
                            currencyCodeIso4217: 'IDR',
                            amount1000: 50000 * 1000,
                            requestFrom: sock.authState.creds.me.id,
                            noteMessage: {
                                extendedTextMessage: {
                                    text: 'Payment for bot services',
                                },
                            },
                        },
                    })
                }

                // ── 25. View-once image ──────────────────────────────────
                else if (text === '!viewonce') {
                    await sock.sendMessage(jid, {
                        image: { url: 'https://picsum.photos/400/400' },
                        caption: 'This can only be viewed once!',
                        viewOnce: true,
                    })
                }

                // ── 26. Album (multi-media) ──────────────────────────────
                else if (text === '!album') {
                    await sock.sendAlbumMessage(jid, [
                        { image: { url: 'https://picsum.photos/800/600?random=1' }, caption: 'Photo 1' },
                        { image: { url: 'https://picsum.photos/800/600?random=2' }, caption: 'Photo 2' },
                        { image: { url: 'https://picsum.photos/800/600?random=3' } },
                    ])
                }

                // ── 27. Forward a message ────────────────────────────────
                else if (text === '!forward') {
                    await sock.sendMessage(jid, { forward: msg, force: true })
                }

                // ── 28. Edit a sent message ──────────────────────────────
                else if (text === '!edit') {
                    const sent = await sock.sendMessage(jid, { text: 'Original message...' })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.sendMessage(jid, { text: 'Edited message ✅', edit: sent.key })
                }

                // ── 29. Delete a message for everyone ────────────────────
                else if (text === '!delete') {
                    const sent = await sock.sendMessage(jid, { text: 'This will be deleted in 3 seconds...' })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.sendMessage(jid, { delete: sent.key })
                }

                // ── 30. Pin a message ────────────────────────────────────
                else if (text === '!pin') {
                    const sent = await sock.sendMessage(jid, { text: 'Pinned message 📌' })
                    await sock.sendMessage(jid, { pin: sent.key, type: 1 })
                }

                // ── 31. Mark a message as unread ─────────────────────────
                else if (text === '!markunread') {
                    await sock.chatModify({ markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                }

                // ── 32. Archive / unarchive chat ─────────────────────────
                else if (text === '!archive') {
                    await sock.chatModify({ archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                    await sock.sendMessage(jid, { text: 'Chat archived 📦' })
                }

                // ── 33. Mute chat (8 hours) ──────────────────────────────
                else if (text === '!mute') {
                    const muteUntil = Date.now() + 8 * 60 * 60 * 1000
                    await sock.chatModify({ mute: muteUntil }, jid)
                    await sock.sendMessage(jid, { text: 'Chat muted for 8 hours 🔇' })
                }

                // ── 34. Delete chat ──────────────────────────────────────
                else if (text === '!deletechat') {
                    await sock.chatModify({ delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)
                }

                // ── 35. Star a message ───────────────────────────────────
                else if (text === '!star') {
                    await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)
                    await sock.sendMessage(jid, { text: 'Message starred ⭐' })
                }

                // ── 36. Fetch profile picture ─────────────────────────────
                else if (text === '!pfp') {
                    const url = await sock.profilePictureUrl(jid, 'image')
                    await sock.sendMessage(jid, { text: url ? `Profile picture: ${url}` : 'No profile picture found.' })
                }

                // ── 37. Check if number is on WhatsApp ────────────────────
                else if (text === '!exists') {
                    const [result] = await sock.onWhatsApp(jid) || []
                    await sock.sendMessage(jid, {
                        text: result?.exists ? `✅ ${jid} is on WhatsApp (LID: ${result.lid || 'n/a'})` : `❌ Number not found on WhatsApp`,
                    })
                }

                // ── 38. Fetch user status text ───────────────────────────
                else if (text === '!status') {
                    const statuses = await sock.fetchStatus(jid)
                    const s = statuses?.[0]?.status || 'No status set'
                    await sock.sendMessage(jid, { text: `Status: ${s}` })
                }

                // ── 39. Download received media ───────────────────────────
                else if (text === '!download') {
                    // Re-send the last message in this chat that contained media
                    const chatMsgs = store.messages[jid]?.array || []
                    const mediaMsg = [...chatMsgs].reverse().find(m => {
                        const c = m.message
                        if (!c) return false
                        const t = getContentType(c)
                        return ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(t)
                    })
                    if (mediaMsg) {
                        const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {})
                        await sock.sendMessage(jid, { text: `Downloaded ${buffer.length} bytes ✅` })
                    } else {
                        await sock.sendMessage(jid, { text: 'No downloadable media found in this chat.' })
                    }
                }

                // ── 40. Status with mention (story/status update) ─────────
                else if (text === '!mystatus') {
                    await sock.sendStatusMentions(
                        { text: '🚀 Powered by @yemo-dev/yebail!' },
                        [jid] // mentions this user — triggers notification
                    )
                    await sock.sendMessage(jid, { text: 'Status posted with your mention!' })
                }

                // ── 41. Get blocklist ─────────────────────────────────────
                else if (text === '!blocklist') {
                    const list = await sock.fetchBlocklist()
                    await sock.sendMessage(jid, { text: `Blocklist (${list.length} entries):\n${list.join('\n') || 'empty'}` })
                }

                // ── 42. Block a contact ───────────────────────────────────
                else if (text === '!block') {
                    await sock.updateBlockStatus(jid, 'block')
                    await sock.sendMessage(jid, { text: `${jid} has been blocked.` })
                }

                // ── 43. Unblock a contact ─────────────────────────────────
                else if (text === '!unblock') {
                    await sock.updateBlockStatus(jid, 'unblock')
                    await sock.sendMessage(jid, { text: `${jid} has been unblocked.` })
                }

                // ── 44. Update own profile name ───────────────────────────
                else if (text === '!setname') {
                    await sock.updateProfileName('Yebail Bot 🤖')
                    await sock.sendMessage(jid, { text: 'Profile name updated!' })
                }

                // ── 45. Update own profile status text ────────────────────
                else if (text === '!setstatus') {
                    await sock.updateProfileStatus('Running on @yemo-dev/yebail 🚀')
                    await sock.sendMessage(jid, { text: 'Profile status updated!' })
                }

                // ── 46. Privacy: last-seen to contacts only ────────────────
                else if (text === '!privacy') {
                    await sock.updateLastSeenPrivacy('contacts')
                    await sock.updateOnlinePrivacy('match_last_seen')
                    await sock.updateProfilePicturePrivacy('contacts')
                    await sock.updateStatusPrivacy('contacts')
                    await sock.updateReadReceiptsPrivacy('all')
                    await sock.updateGroupsAddPrivacy('contacts')
                    await sock.sendMessage(jid, { text: 'Privacy settings updated ✅' })
                }

                // ── 47. Disappearing messages default (90 days) ───────────
                else if (text === '!disappear') {
                    await sock.updateDefaultDisappearingMode(90 * 24 * 60 * 60) // 90 days in seconds
                    await sock.sendMessage(jid, { text: 'Default disappearing mode set to 90 days' })
                }

                // ── 48. Create a group ────────────────────────────────────
                else if (text === '!creategroup') {
                    const group = await sock.groupCreate('Yebail Test Group', [jid])
                    await sock.sendMessage(jid, { text: `Group created! JID: ${group.id}` })
                }

                // ── 49. Get group invite link ─────────────────────────────
                else if (text.startsWith('!invitelink ')) {
                    const groupJid = text.replace('!invitelink ', '').trim()
                    const code = await sock.groupInviteCode(groupJid)
                    await sock.sendMessage(jid, { text: `Invite link: https://chat.whatsapp.com/${code}` })
                }

                // ── 50. Accept group invite ───────────────────────────────
                else if (text.startsWith('!joingroup ')) {
                    const code = text.replace('!joingroup ', '').trim()
                    const groupJid = await sock.groupAcceptInvite(code)
                    await sock.sendMessage(jid, { text: `Joined group: ${groupJid}` })
                }

                // ── 51. Group info ────────────────────────────────────────
                else if (text.startsWith('!groupinfo ')) {
                    const groupJid = text.replace('!groupinfo ', '').trim()
                    const meta = await sock.groupMetadata(groupJid)
                    await sock.sendMessage(jid, {
                        text: [
                            `📋 *Group Info*`,
                            `Name: ${meta.subject}`,
                            `ID: ${meta.id}`,
                            `Members: ${meta.size || meta.participants.length}`,
                            `Description: ${meta.desc || 'none'}`,
                            `Owner: ${meta.owner}`,
                            `Restricted: ${meta.restrict}`,
                            `Announce: ${meta.announce}`,
                        ].join('\n'),
                    })
                }

                // ── 52. Add participant to group ──────────────────────────
                else if (text.startsWith('!addmember ')) {
                    const [groupJid, memberJid] = text.replace('!addmember ', '').split(' ')
                    const result = await sock.groupParticipantsUpdate(groupJid, [memberJid], 'add')
                    await sock.sendMessage(jid, { text: JSON.stringify(result) })
                }

                // ── 53. Remove participant from group ─────────────────────
                else if (text.startsWith('!removemember ')) {
                    const [groupJid, memberJid] = text.replace('!removemember ', '').split(' ')
                    const result = await sock.groupParticipantsUpdate(groupJid, [memberJid], 'remove')
                    await sock.sendMessage(jid, { text: JSON.stringify(result) })
                }

                // ── 54. Promote to admin ──────────────────────────────────
                else if (text.startsWith('!promote ')) {
                    const [groupJid, memberJid] = text.replace('!promote ', '').split(' ')
                    await sock.groupParticipantsUpdate(groupJid, [memberJid], 'promote')
                    await sock.sendMessage(jid, { text: `${memberJid} promoted to admin in ${groupJid}` })
                }

                // ── 55. Demote from admin ─────────────────────────────────
                else if (text.startsWith('!demote ')) {
                    const [groupJid, memberJid] = text.replace('!demote ', '').split(' ')
                    await sock.groupParticipantsUpdate(groupJid, [memberJid], 'demote')
                    await sock.sendMessage(jid, { text: `${memberJid} demoted in ${groupJid}` })
                }

                // ── 56. Enable group ephemeral (7 days) ───────────────────
                else if (text.startsWith('!ephemeral ')) {
                    const groupJid = text.replace('!ephemeral ', '').trim()
                    await sock.groupToggleEphemeral(groupJid, 604800) // 7 days
                    await sock.sendMessage(jid, { text: 'Ephemeral messages enabled (7 days)' })
                }

                // ── 57. List all groups bot is in ─────────────────────────
                else if (text === '!groups') {
                    const groups = await sock.groupFetchAllParticipating()
                    const names = Object.values(groups).map(g => `• ${g.subject} (${g.id})`).join('\n')
                    await sock.sendMessage(jid, { text: `Groups (${Object.keys(groups).length}):\n${names}` })
                }

                // ── 58. Get join requests in a group ─────────────────────
                else if (text.startsWith('!joinrequests ')) {
                    const groupJid = text.replace('!joinrequests ', '').trim()
                    const reqs = await sock.groupRequestParticipantsList(groupJid)
                    await sock.sendMessage(jid, { text: `Pending join requests: ${JSON.stringify(reqs)}` })
                }

                // ── 59. Approve join request ──────────────────────────────
                else if (text.startsWith('!approve ')) {
                    const [groupJid, memberJid] = text.replace('!approve ', '').split(' ')
                    await sock.groupRequestParticipantsUpdate(groupJid, [memberJid], 'approve')
                    await sock.sendMessage(jid, { text: `${memberJid} approved.` })
                }

                // ── 60. Create newsletter ─────────────────────────────────
                else if (text === '!createnewsletter') {
                    const nl = await sock.newsletterCreate('Yebail News', 'Official Yebail updates')
                    await sock.sendMessage(jid, { text: `Newsletter created: ${nl.id}` })
                }

                // ── 61. Follow newsletter ─────────────────────────────────
                else if (text.startsWith('!follow ')) {
                    const nlJid = text.replace('!follow ', '').trim()
                    await sock.newsletterFollow(nlJid)
                    await sock.sendMessage(jid, { text: `Followed ${nlJid}` })
                }

                // ── 62. Unfollow newsletter ───────────────────────────────
                else if (text.startsWith('!unfollow ')) {
                    const nlJid = text.replace('!unfollow ', '').trim()
                    await sock.newsletterUnfollow(nlJid)
                    await sock.sendMessage(jid, { text: `Unfollowed ${nlJid}` })
                }

                // ── 63. Mute newsletter ───────────────────────────────────
                else if (text.startsWith('!mutenl ')) {
                    const nlJid = text.replace('!mutenl ', '').trim()
                    await sock.newsletterMute(nlJid)
                    await sock.sendMessage(jid, { text: `Muted newsletter ${nlJid}` })
                }

                // ── 64. Get newsletter metadata ───────────────────────────
                else if (text.startsWith('!nlinfo ')) {
                    const nlJid = text.replace('!nlinfo ', '').trim()
                    const meta = await sock.newsletterMetadata('JID', nlJid)
                    await sock.sendMessage(jid, {
                        text: [
                            `📰 *Newsletter Info*`,
                            `Name: ${meta.name}`,
                            `ID: ${meta.id}`,
                            `Subscribers: ${meta.subscribers}`,
                            `Description: ${meta.description}`,
                            `Verification: ${meta.verification}`,
                        ].join('\n'),
                    })
                }

                // ── 65. React to newsletter message ───────────────────────
                else if (text.startsWith('!nlreact ')) {
                    // Usage: !nlreact <newsletter_jid> <server_id> <emoji>
                    const parts = text.replace('!nlreact ', '').split(' ')
                    const [nlJid, serverId, emoji] = parts
                    await sock.newsletterReactMessage(nlJid, serverId, emoji)
                    await sock.sendMessage(jid, { text: `Reacted with ${emoji}` })
                }

                // ── 66. Get bot list ──────────────────────────────────────
                else if (text === '!bots') {
                    const bots = await sock.getBotListV2()
                    await sock.sendMessage(jid, { text: `Available bots: ${JSON.stringify(bots)}` })
                }

                // ── 67. Create community ──────────────────────────────────
                else if (text === '!community') {
                    const community = await sock.communityCreate('Yebail Community', 'Welcome to the Yebail community!')
                    if (community?.value) {
                        await sock.sendMessage(jid, { text: `Community created: ${community.value.id}` })
                    } else {
                        await sock.sendMessage(jid, { text: 'Community created (check your WhatsApp for details).' })
                    }
                }

                // ── 68. Create a call link ────────────────────────────────
                else if (text === '!calllink') {
                    const token = await sock.createCallLink('video')
                    await sock.sendMessage(jid, { text: `Call link token: ${token}` })
                }

                // ── 69. Presence: typing / recording / available ──────────
                else if (text === '!typing') {
                    await sock.sendPresenceUpdate('composing', jid)
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.sendPresenceUpdate('paused', jid)
                    await sock.sendMessage(jid, { text: 'Done simulating typing.' })
                }

                // ── 70. Presence subscribe (see online status) ────────────
                else if (text === '!subscribe') {
                    await sock.presenceSubscribe(jid)
                    await sock.sendMessage(jid, { text: `Subscribed to presence updates for ${jid}` })
                }

                // ── 71. Help menu ─────────────────────────────────────────
                else if (text === '!help') {
                    const help = [
                        '*📖 Yebail Bot — Command List*',
                        '',
                        '*Messages*',
                        '!ping, !link, !mention, !reply, !image, !imagefile',
                        '!video, !gif, !audio, !voice, !doc, !sticker',
                        '!contact, !contacts, !location, !livelocation',
                        '!poll, !react, !unreact, !list, !buttons',
                        '!interactive, !quickreply, !pay, !viewonce',
                        '!album, !forward, !edit, !delete, !pin',
                        '',
                        '*Chat*',
                        '!markunread, !archive, !mute, !deletechat, !star',
                        '',
                        '*Profile & Privacy*',
                        '!pfp, !exists, !status, !mystatus',
                        '!setname, !setstatus, !privacy, !disappear',
                        '',
                        '*Block*',
                        '!blocklist, !block, !unblock',
                        '',
                        '*Groups*',
                        '!creategroup, !invitelink <jid>, !joingroup <code>',
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
                        '*Other*',
                        '!bots, !community, !calllink',
                        '!typing, !subscribe, !download',
                        '!help',
                    ].join('\n')
                    await sock.sendMessage(jid, { text: help })
                }

                // ── Stop typing indicator ─────────────────────────────────
                await sock.sendPresenceUpdate('paused', jid)
            }
        }
    })

    return sock
}

// ─── Run ──────────────────────────────────────────────────────────────────────
startSock().catch(console.error)
