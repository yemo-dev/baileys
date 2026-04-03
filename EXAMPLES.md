# yebail Full Documentation & Examples

This document contains a comprehensive set of examples and detailed explanations for using the **yebail** library.

## Index

- [Connecting Account](#connecting-account)
    - [Connect with QR-CODE](#connect-with-qr-code)
    - [Connect with Pairing Code](#connect-with-pairing-code)
    - [Receive Full History](#receive-full-history)
- [Important Notes About Socket Config](#important-notes-about-socket-config)
    - [Caching Group Metadata](#caching-group-metadata-recommended)
    - [Improve Retry System & Decrypt Poll Votes](#improve-retry-system--decrypt-poll-votes)
    - [Receive Notifications in Whatsapp App](#receive-notifications-in-whatsapp-app)
    - [Custom generateMessageID Function](#custom-generatemessageid-function)
- [Save Auth Info](#save-auth-info)
- [Handling Events](#handling-events)
    - [Example to Start](#example-to-start)
    - [Decrypt Poll Votes](#decrypt-poll-votes)
    - [Summary of Events on First Connection](#summary-of-events-on-first-connection)
- [Implementing a Data Store](#implementing-a-data-store)
- [Whatsapp IDs Explain](#whatsapp-ids-explain)
- [Utility Functions](#utility-functions)
- [Batch Contact Lookup](#batch-contact-lookup)
- [Account Restriction Check](#account-restriction-check)
- [Audio Transcoding](#audio-transcoding)
- [Sending Messages](#sending-messages)
    - [Text Messages](#text-messages)
    - [Quote / Reply](#quote--reply)
    - [Mention Users](#mention-users)
    - [Sending with Link Preview](#sending-with-link-preview)
    - [Media Messages](#media-messages)
    - [Voice Note (PTT)](#voice-note-ptt)
    - [PTV (Push-to-Video)](#ptv-push-to-video)
    - [Document Message](#document-message)
    - [Sticker Message](#sticker-message)
    - [Contact Card](#contact-card)
    - [Multiple Contacts](#multiple-contacts)
    - [Location Message](#location-message)
    - [Live Location Message](#live-location-message)
    - [Poll Message](#poll-message)
    - [Reaction Message](#reaction-message)
    - [List Message](#list-message)
    - [Buttons Message](#buttons-message)
    - [Interactive Message (Native Flow)](#interactive-message-native-flow)
    - [Carousel Message](#carousel-message)
    - [Album Message](#album-message)
    - [View-Once Message](#view-once-message)
    - [Forward Message](#forward-message)
    - [Payment Request](#payment-request)
    - [Status / Story with Mention](#status--story-with-mention)
- [Modify Messages](#modify-messages)
    - [Editing Messages](#editing-messages)
    - [Deleting Messages](#deleting-messages)
    - [Pin a Message](#pin-a-message)
    - [Star a Message](#star-a-message)
- [Manipulating Media Messages](#manipulating-media-messages)
- [Read Receipts](#read-receipts)
- [Reject Call](#reject-call)
- [Send States in Chat (Presence)](#send-states-in-chat-presence)
- [Modifying Chats](#modifying-chats)
- [User Queries](#user-queries)
    - [Check WhatsApp Availability](#check-whatsapp-availability)
    - [Fetch Profile Picture](#fetch-profile-picture)
    - [Fetch Status Text](#fetch-status-text)
    - [Fetch Disappearing Duration](#fetch-disappearing-duration)
- [Change Profile](#change-profile)
- [Privacy Settings](#privacy-settings)
- [Block / Unblock](#block--unblock)
- [Groups](#groups)
    - [Create a Group](#create-a-group)
    - [Leave a Group](#leave-a-group)
    - [Update Group Subject](#update-group-subject)
    - [Update Group Description](#update-group-description)
    - [Add / Remove Participants](#add--remove-participants)
    - [Promote / Demote Admins](#promote--demote-admins)
    - [Invite Code](#invite-code)
    - [Revoke Invite Code](#revoke-invite-code)
    - [Accept Invite](#accept-invite)
    - [Get Invite Info](#get-invite-info)
    - [Accept Invite V4 (from message)](#accept-invite-v4-from-message)
    - [Revoke Invite V4](#revoke-invite-v4)
    - [Join Requests (Approval Mode)](#join-requests-approval-mode)
    - [Group Settings](#group-settings)
    - [Ephemeral Messages in Group](#ephemeral-messages-in-group)
    - [Fetch Group Metadata](#fetch-group-metadata)
    - [Fetch All Participating Groups](#fetch-all-participating-groups)
    - [Community Features](#community-features)
- [Newsletter](#newsletter)
    - [Create a Newsletter](#create-a-newsletter)
    - [Newsletter Actions](#newsletter-actions)
    - [Update Newsletter](#update-newsletter)
    - [Fetch Newsletter Messages](#fetch-newsletter-messages)
    - [React to Newsletter Message](#react-to-newsletter-message)
    - [Newsletter Admin Management](#newsletter-admin-management)
- [Business Profile](#business-profile)
- [Privacy Settings (Full)](#privacy-settings-full)
- [Broadcast Lists & Stories](#broadcast-lists--stories)
- [Label Management](#label-management)
- [Bot Features](#bot-features)
- [Call Link](#call-link)
- [Writing Custom Functionality](#writing-custom-functionality)

---

## Connecting Account

WhatsApp provides a multi-device API that allows yebail to be authenticated as a second WhatsApp client by scanning a QR code or using a Pairing Code.

### Connect with QR-CODE

To connect using a QR code, you can use the `printQRInTerminal` option. You can also customize the browser name.

```javascript
const { default: makeWASocket, Browsers } = require("@yemo-dev/yebail")

const sock = makeWASocket({
    // Customize browser name (e.g., Ubuntu, Chrome)
    browser: Browsers.ubuntu('My Yebail App'),
    printQRInTerminal: true
})
```

Scan the printed QR code with your phone to login.

### Connect with Pairing Code

Pairing Code allows you to connect without scanning a QR. This is useful for remote servers. Note that the phone number must include the country code without any special characters.

```javascript
const { default: makeWASocket } = require("@yemo-dev/yebail")

const sock = makeWASocket({
    printQRInTerminal: false // Must be false for pairing code
})

if (!sock.authState.creds.registered) {
    const number = '628xxxxxxxx' // replace with your number
    const code = await sock.requestPairingCode(number)
    console.log('Your Pairing Code:', code)
}
```

### Receive Full History

By default, WhatsApp Web only syncs recent messages. To receive the full history:
1. Set `syncFullHistory` to `true`.
2. Emulate a desktop browser (macOS or Windows).

```javascript
const sock = makeWASocket({
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: true
})
```

---

## Important Notes About Socket Config

### Caching Group Metadata (Recommended)

Fetching group metadata for every message can be slow. Implementing a cache is highly recommended.

```javascript
const NodeCache = require('@cacheable/node-cache')
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const sock = makeWASocket({
    cachedGroupMetadata: async (jid) => groupCache.get(jid)
})

// Update cache on group events
sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})

sock.ev.on('group-participants.update', async (event) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
```

### Improve Retry System & Decrypt Poll Votes

To handle message retries and poll decryption effectively, the socket needs access to the original message stored in your database.

```javascript
const sock = makeWASocket({
    getMessage: async (key) => {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg?.message || undefined
        }
        return { conversation: 'hello' }
    }
})
```

### Receive Notifications in Whatsapp App

If you want the main WhatsApp app on your phone to still receive notifications while the bot is connected, set `markOnlineOnConnect` to `false`.

```javascript
const sock = makeWASocket({
    markOnlineOnConnect: false
})
```

### Custom generateMessageID Function

You can customize how message IDs are generated. yebail defaults to a 32-character hex ID for better indexing.

```javascript
const crypto = require('crypto')

const sock = makeWASocket({
    generateMessageID: () => crypto.randomBytes(16).toString('hex').toUpperCase()
})
```

---

## Save Auth Info

Saving the authentication state is crucial so you don't have to re-scan the QR code.

```javascript
const { useMultiFileAuthState } = require("@yemo-dev/yebail")

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        auth: state
    })

    // This listener saves the session whenever it's updated
    sock.ev.on('creds.update', saveCreds)
}
```

---

## Handling Events

yebail uses an event-driven architecture. You can listen for various updates like new messages, connection status, and more.

### Example to Start (Full Template)

```javascript
const makeWASocket = require("@yemo-dev/yebail").default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestWaWebVersion } = require("@yemo-dev/yebail");
const { Boom } = require('@hapi/boom');

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const { version, isLatest } = await fetchLatestWaWebVersion()
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true
            console.log('Connection closed. Reconnecting:', shouldReconnect)
            if(shouldReconnect) connectToWhatsApp()
        } else if(connection === 'open') {
            console.log('Connection opened successfully!')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        console.log('Received message:', JSON.stringify(m, undefined, 2))
        const msg = m.messages[0]
        if(!msg.key.fromMe && m.type === 'notify') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello from yebail!' })
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()
```

### Decrypt Poll Votes

Poll updates are sent as separate events. Use `getAggregateVotesInPollMessage` to process them.

```javascript
const { getAggregateVotesInPollMessage } = require('@yemo-dev/yebail')

sock.ev.on('messages.update', async (event) => {
    for(const { key, update } of event) {
        if(update.pollUpdates) {
            const pollCreation = await store.loadMessage(key.remoteJid, key.id)
            if(pollCreation) {
                const votes = getAggregateVotesInPollMessage({
                    message: pollCreation.message,
                    pollUpdates: update.pollUpdates,
                })
                console.log('Current poll status:', votes)
            }
        }
    }
})
```

### Summary of Events on First Connection

1. `connection.update`: Initially triggers with `qr` or `pairingCode`.
2. `creds.update`: Fired multiple times during initial setup.
3. `messaging.history-set`: Fired when old messages are being synced.

---

## Implementing a Data Store

A data store keeps track of chats, contacts, and messages in memory or on disk.

```javascript
const { makeInMemoryStore } = require("@yemo-dev/yebail");
const store = makeInMemoryStore({})
store.readFromFile('./baileys_store.json')

setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)

const sock = makeWASocket({ /* ... */ })
store.bind(sock.ev)

sock.ev.on('chats.upsert', () => {
    console.log('Synced chats:', store.chats.all())
})

// Load a specific message later
const msg = await store.loadMessage('628xxx@s.whatsapp.net', 'MESSAGE_ID')
```

---

## Whatsapp IDs Explain

- **JID**: Jabber ID. The format is generally `[country][number]@s.whatsapp.net`.
- **Groups**: `[creator-number]-[timestamp]@g.us`.
- **Newsletter**: `[id]@newsletter`.
- **LID**: Modern identity-based ID used by yebail for better authentication tracking.

```javascript
const { jidDecode, jidNormalizedUser, jidEncode, isJidGroup, isJidNewsletter, isJidUser } = require('@yemo-dev/yebail')

// Decode a JID into its components
const { user, server, device } = jidDecode('628xxx@s.whatsapp.net')

// Normalize (strip device suffix)
const normalized = jidNormalizedUser('628xxx:10@s.whatsapp.net') // '628xxx@s.whatsapp.net'

// Build a JID
const jid = jidEncode('628xxx', 's.whatsapp.net') // '628xxx@s.whatsapp.net'

// Type checks
console.log(isJidGroup('xxxx-xxxx@g.us'))       // true
console.log(isJidNewsletter('xxx@newsletter'))   // true
console.log(isJidUser('628xxx@s.whatsapp.net'))  // true
```

---

## Utility Functions

```javascript
const {
    getContentType,
    downloadMediaMessage,
    generateMessageID,
    normalizeMessageContent,
    extractMessageContent,
} = require('@yemo-dev/yebail')

// Identify message type
const type = getContentType(msg.message) // e.g. 'imageMessage', 'conversation'

// Download media to buffer
const buffer = await downloadMediaMessage(msg, 'buffer', {})
// Or download to stream
const stream = await downloadMediaMessage(msg, 'stream', {})

// Generate a unique message ID
const id = generateMessageID()

// Normalize / unwrap message (removes deviceSentMessage wrapper etc.)
const content = normalizeMessageContent(msg.message)
```

---

## Batch Contact Lookup

You can verify many IDs at once.

```javascript
const result = await sock.onWhatsApp(
    '6281111111111@s.whatsapp.net',
    '6282222222222@s.whatsapp.net',
    '6283333333333@s.whatsapp.net'
)

for (const r of result) {
    console.log(r.jid, '→ exists:', r.exists, '| lid:', r.lid)
}
```

---

## Account Restriction Check

Use this before sending if you want to inspect timelock or message cap status.

```javascript
const restriction = await sock.checkAccountRestriction()

console.log(restriction.isRestricted)
console.log(restriction.reachoutTimelock)
console.log(restriction.messageCap)
```

---

## Audio Transcoding

Enable optional audio conversion before sending.

```javascript
const { transcodeAudio } = require('@yemo-dev/yebail')

const audio = await transcodeAudio('./voice.mp3', { bitrate: '64k' })

await sock.sendMessage(jid, {
    audio,
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true
}, {
    transcodeAudio: true,
    audioBitrate: '64k'
})
```

---

## Sending Messages

### Text Messages

```javascript
// Plain text
await sock.sendMessage(jid, { text: 'Hello World! 👋' })

// Text with formatting (WhatsApp markdown)
await sock.sendMessage(jid, {
    text: '*bold* _italic_ ~strikethrough~ ```monospace```'
})
```

### Quote / Reply

```javascript
// Replying to a specific message (pass the original message as `quoted`)
await sock.sendMessage(jid, { text: 'This is a reply!' }, { quoted: msg })
```

### Mention Users

```javascript
// Mention one or more users in a message
await sock.sendMessage(jid, {
    text: `Hello @628111111111 and @628222222222!`,
    mentions: ['628111111111@s.whatsapp.net', '628222222222@s.whatsapp.net']
})
```

### Sending with Link Preview

yebail automatically generates link previews for URLs in text messages.

```javascript
// Auto link preview
await sock.sendMessage(jid, {
    text: 'Check this out: https://github.com/yemo-dev/baileys'
})

// Disable link preview globally via socket config
const sock = makeWASocket({
    generateHighQualityLinkPreview: false
})
```

### Media Messages

#### Image

```javascript
// From URL
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/photo.jpg' },
    caption: 'A beautiful photo 📸'
})

// From file buffer
const fs = require('fs')
await sock.sendMessage(jid, {
    image: fs.readFileSync('./photo.jpg'),
    caption: 'From local file'
})

// From base64
await sock.sendMessage(jid, {
    image: Buffer.from('<base64_string>', 'base64'),
    caption: 'Base64 image'
})
```

#### Video

```javascript
// From URL
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/video.mp4' },
    caption: 'Watch this! 🎬'
})

// GIF (loops automatically)
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/animation.mp4' },
    gifPlayback: true,
    caption: 'Animated GIF 🎞️'
})
```

### Voice Note (PTT)

```javascript
await sock.sendMessage(jid, {
    audio: { url: 'https://example.com/voice.ogg' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true // Push-to-Talk — appears as voice note
})
```

### PTV (Push-to-Video)

```javascript
// Round video (like PTT but video)
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/clip.mp4' },
    ptv: true
})
```

### Document Message

```javascript
await sock.sendMessage(jid, {
    document: { url: 'https://example.com/file.pdf' },
    mimetype: 'application/pdf',
    fileName: 'report.pdf',
    caption: 'Monthly report 📄'
})
```

### Sticker Message

```javascript
// Regular sticker (WebP)
await sock.sendMessage(jid, {
    sticker: { url: 'https://example.com/sticker.webp' }
})

// Animated (Lottie) sticker
await sock.sendMessage(jid, {
    sticker: fs.readFileSync('./sticker.tgs'), // Lottie sticker file
    isLottie: true
})
```

### Contact Card

```javascript
await sock.sendMessage(jid, {
    contacts: {
        displayName: 'John Doe',
        contacts: [
            {
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL;type=CELL;type=VOICE;waid=628111111111:+62 811-1111-1111
EMAIL:john@example.com
END:VCARD`
            }
        ]
    }
})
```

### Multiple Contacts

```javascript
await sock.sendMessage(jid, {
    contacts: {
        displayName: '2 Contacts',
        contacts: [
            { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Alice\nTEL;waid=628111111111:+62811\nEND:VCARD` },
            { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Bob\nTEL;waid=628222222222:+62822\nEND:VCARD` }
        ]
    }
})
```

### Location Message

```javascript
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        name: 'Jakarta, Indonesia',
        address: 'DKI Jakarta, Indonesia'
    }
})
```

### Live Location Message

```javascript
await sock.sendMessage(jid, {
    liveLocation: {
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        accuracyInMeters: 10,
        speedInMps: 0,
        degreesClockwiseFromMagneticNorth: 0,
        sequenceNumber: BigInt(Date.now()),
        timeSinceLastUpdate: 0,
    },
    caption: 'Live location active for 30 minutes'
})
```

### Poll Message

```javascript
// Single-answer poll
await sock.sendMessage(jid, {
    poll: {
        name: 'What is your favorite color?',
        values: ['🔴 Red', '🟢 Green', '🔵 Blue', '🟡 Yellow'],
        selectableCount: 1 // 0 = multi-select
    }
})

// Multi-select poll
await sock.sendMessage(jid, {
    poll: {
        name: 'Select your hobbies:',
        values: ['Gaming', 'Reading', 'Coding', 'Cooking', 'Sports'],
        selectableCount: 0 // 0 = any number of selections
    }
})
```

### Reaction Message

```javascript
// Add reaction
await sock.sendMessage(jid, {
    react: {
        text: '❤️',   // emoji
        key: msg.key  // key of the message to react to
    }
})

// Remove reaction (empty string)
await sock.sendMessage(jid, {
    react: {
        text: '',
        key: msg.key
    }
})
```

### List Message

```javascript
await sock.sendMessage(jid, {
    listMessage: {
        title: '🍕 Order Menu',
        text: 'Please select from the options below:',
        footerText: 'Powered by Yebail',
        buttonText: 'Open Menu',
        listType: 1, // SINGLE_SELECT
        sections: [
            {
                title: 'Main Course',
                rows: [
                    { title: 'Pizza Margherita', description: 'Classic tomato & mozzarella', rowId: 'pizza' },
                    { title: 'Burger Deluxe',    description: 'Double beef patty',          rowId: 'burger' },
                    { title: 'Pasta Carbonara',  description: 'Creamy bacon pasta',         rowId: 'pasta' }
                ]
            },
            {
                title: 'Drinks',
                rows: [
                    { title: 'Cola',        description: '500ml chilled',   rowId: 'cola' },
                    { title: 'Orange Juice', description: 'Fresh squeezed', rowId: 'juice' }
                ]
            }
        ]
    }
})
```

### Buttons Message

```javascript
await sock.sendMessage(jid, {
    buttonsMessage: {
        text: 'What would you like to do?',
        footerText: 'Yebail Bot',
        headerType: 1, // 1 = text header
        buttons: [
            { buttonId: 'id1', buttonText: { displayText: '📋 View Menu' },   type: 1 },
            { buttonId: 'id2', buttonText: { displayText: '🛒 Place Order' }, type: 1 },
            { buttonId: 'id3', buttonText: { displayText: '❓ Help' },        type: 1 }
        ]
    }
})
```

#### Buttons with Image Header

```javascript
await sock.sendMessage(jid, {
    buttonsMessage: {
        contentText: 'Choose an option:',
        footerText: 'Yebail',
        headerType: 4, // 4 = image header
        imageMessage: {
            url: 'https://example.com/banner.jpg',
            mimetype: 'image/jpeg'
        },
        buttons: [
            { buttonId: 'yes', buttonText: { displayText: '✅ Yes' }, type: 1 },
            { buttonId: 'no',  buttonText: { displayText: '❌ No' },  type: 1 }
        ]
    }
})
```

### Interactive Message (Native Flow)

#### Single-Select Dropdown

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: {
            title: 'Select a Plan',
            hasMediaAttachment: false
        },
        body: { text: 'Please choose your subscription plan:' },
        footer: { text: 'Yebail Services' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Available Plans',
                        sections: [
                            {
                                title: 'Plans',
                                rows: [
                                    { header: 'Free',    title: 'Free Plan',    description: 'Basic features only', id: 'free'    },
                                    { header: 'Basic',   title: 'Basic – $5',   description: 'More features',       id: 'basic'   },
                                    { header: 'Premium', title: 'Premium – $20', description: 'All features',       id: 'premium' }
                                ]
                            }
                        ]
                    })
                }
            ],
            messageParamsJson: ''
        }
    }
})
```

#### Quick Reply Buttons

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: { title: '🤔 Quick Question', hasMediaAttachment: false },
        body:   { text: 'Are you enjoying yebail?' },
        footer: { text: 'yebail' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '👍 Yes!',  id: 'yes' })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '👎 Not yet', id: 'no' })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '🤷 Maybe', id: 'maybe' })
                }
            ],
            messageParamsJson: ''
        }
    }
})
```

#### CTA URL Button

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: { title: '🔗 Visit Our Website', hasMediaAttachment: false },
        body:   { text: 'Click the button below to visit our website.' },
        footer: { text: 'yebail' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🌐 Open Website',
                        url: 'https://github.com/yemo-dev/baileys',
                        merchant_url: 'https://github.com/yemo-dev/baileys'
                    })
                }
            ],
            messageParamsJson: ''
        }
    }
})
```

#### CTA Copy Button

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: { title: 'Your Promo Code', hasMediaAttachment: false },
        body:   { text: 'Use the promo code below for 20% off.' },
        footer: { text: 'yebail Shop' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copy Code',
                        id: 'promo_code',
                        copy_code: 'YEBAIL20'
                    })
                }
            ],
            messageParamsJson: ''
        }
    }
})
```

### Carousel Message

```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        body: { text: 'Browse our products:' },
        footer: { text: 'Swipe to see more →' },
        carouselMessage: {
            cards: [
                {
                    header: {
                        imageMessage: {
                            url: 'https://example.com/product1.jpg',
                            mimetype: 'image/jpeg'
                        },
                        hasMediaAttachment: true
                    },
                    body:   { text: 'Product 1 – Best seller' },
                    footer: { text: 'Rp 99.000' },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: '🛒 Buy Now', id: 'buy_1' })
                            }
                        ],
                        messageParamsJson: ''
                    }
                },
                {
                    header: {
                        imageMessage: {
                            url: 'https://example.com/product2.jpg',
                            mimetype: 'image/jpeg'
                        },
                        hasMediaAttachment: true
                    },
                    body:   { text: 'Product 2 – New arrival' },
                    footer: { text: 'Rp 149.000' },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: '🛒 Buy Now', id: 'buy_2' })
                            }
                        ],
                        messageParamsJson: ''
                    }
                }
            ]
        }
    }
})
```

### Album Message

Groups multiple images/videos into a WhatsApp album (requires at least 2 items).

```javascript
// Using the dedicated helper
await sock.sendAlbumMessage(jid, [
    { image: { url: 'https://picsum.photos/800/600?1' }, caption: 'Photo 1' },
    { image: { url: 'https://picsum.photos/800/600?2' }, caption: 'Photo 2' },
    { video: { url: 'https://example.com/clip.mp4' },    caption: 'Video 1' }
], { delay: 300 }) // optional delay between items in ms

// Or via sendMessage with the album key
await sock.sendMessage(jid, {
    album: [
        { image: { url: 'https://picsum.photos/800/600?1' }, caption: 'Image 1' },
        { image: { url: 'https://picsum.photos/800/600?2' } },
        { video: { url: 'https://example.com/clip.mp4' }, caption: 'Video 1' }
    ],
    caption: 'Check out these photos!'
})
```

### View-Once Message

```javascript
// View-once image
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/secret.jpg' },
    caption: 'View once only!',
    viewOnce: true
})

// View-once video
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/secret.mp4' },
    caption: 'You can only watch this once.',
    viewOnce: true
})
```

### Forward Message

```javascript
// Forward any message
await sock.sendMessage(jid, { forward: msg })

// Forward and mark as forwarded (shows forwarded badge)
await sock.sendMessage(jid, { forward: msg, force: true })
```

### Payment Request

```javascript
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currencyCodeIso4217: 'IDR',
        amount1000: 100000 * 1000, // amount × 1000
        requestFrom: sock.authState.creds.me.id,
        noteMessage: {
            extendedTextMessage: {
                text: 'Payment for subscription – Thank you!'
            }
        }
    }
})
```

### Status / Story with Mention

```javascript
// Post a text status that mentions specific users
await sock.sendStatusMentions(
    { text: '🚀 Testing yebail features!' },
    ['628xxx@s.whatsapp.net', '628yyy@s.whatsapp.net']
)

// Post an image status with mention
await sock.sendStatusMentions(
    {
        image: { url: 'https://example.com/photo.jpg' },
        caption: 'Check this out!'
    },
    ['628xxx@s.whatsapp.net']
)
```

---

## Modify Messages

### Editing Messages

```javascript
// Edit a message you sent
const sent = await sock.sendMessage(jid, { text: 'Original text' })

// Later, edit it
await sock.sendMessage(jid, {
    text: 'Corrected text ✅',
    edit: sent.key
})
```

### Deleting Messages

```javascript
// Delete message for everyone
await sock.sendMessage(jid, { delete: msg.key })

// Delete your own message (revoke)
const sent = await sock.sendMessage(jid, { text: 'This will be deleted' })
await sock.sendMessage(jid, { delete: sent.key })
```

### Pin a Message

```javascript
// Pin a message (type 1 = pin, duration 86400 = 24h)
const sent = await sock.sendMessage(jid, { text: 'Important pinned message!' })
await sock.sendMessage(jid, { pin: sent.key, type: 1 })

// Unpin
await sock.sendMessage(jid, { pin: sent.key, type: 2 })
```

### Star a Message

```javascript
// Star a message
await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)

// Unstar a message
await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], false)
```

---

## Manipulating Media Messages

```javascript
const { downloadMediaMessage } = require('@yemo-dev/yebail')
const fs = require('fs')

sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const type = getContentType(msg.message)
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']

    if (mediaTypes.includes(type)) {
        // Download to buffer
        const buffer = await downloadMediaMessage(msg, 'buffer', {})
        fs.writeFileSync(`./downloads/media.${getExtension(type)}`, buffer)

        // Download to stream
        const stream = await downloadMediaMessage(msg, 'stream', {})
        const writeStream = fs.createWriteStream('./downloads/stream-file')
        stream.pipe(writeStream)

        console.log(`Downloaded ${type}, size: ${buffer.length} bytes`)
    }
})

function getExtension(type) {
    const map = {
        imageMessage: 'jpg',
        videoMessage: 'mp4',
        audioMessage: 'mp3',
        documentMessage: 'bin',
        stickerMessage: 'webp'
    }
    return map[type] || 'bin'
}
```

---

## Read Receipts

```javascript
// Mark a single message as read
await sock.readMessages([msg.key])

// Mark multiple messages as read
await sock.readMessages([
    { id: 'MSG_ID_1', remoteJid: jid, fromMe: false },
    { id: 'MSG_ID_2', remoteJid: jid, fromMe: false }
])
```

---

## Reject Call

```javascript
sock.ev.on('call', async (calls) => {
    for (const call of calls) {
        if (call.status === 'offer') {
            // Reject the incoming call
            await sock.rejectCall(call.id, call.from)
            console.log('Call rejected from', call.from)
        }
    }
})
```

---

## Send States in Chat (Presence)

```javascript
// Show as online / set your global presence
await sock.sendPresenceUpdate('available')   // available
await sock.sendPresenceUpdate('unavailable') // offline / away

// Send typing indicator to a specific chat
await sock.sendPresenceUpdate('composing', jid)

// Stop typing
await sock.sendPresenceUpdate('paused', jid)

// Show recording audio (for voice messages)
await sock.sendPresenceUpdate('recording', jid)

// Subscribe to another user's presence
await sock.presenceSubscribe(jid)

// React to presence updates
sock.ev.on('presence.update', ({ id, presences }) => {
    for (const [participant, presence] of Object.entries(presences)) {
        console.log(`${participant} is ${presence.lastKnownPresence}`)
        if (presence.lastSeen) {
            console.log(`Last seen: ${new Date(presence.lastSeen * 1000)}`)
        }
    }
})
```

---

## Modifying Chats

```javascript
// Archive a chat
await sock.chatModify(
    { archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Unarchive
await sock.chatModify(
    { archive: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Pin chat
await sock.chatModify({ pin: true }, jid)

// Unpin chat
await sock.chatModify({ pin: false }, jid)

// Mute chat for 8 hours
const muteEndTime = Date.now() + 8 * 60 * 60 * 1000
await sock.chatModify({ mute: muteEndTime }, jid)

// Unmute chat
await sock.chatModify({ mute: null }, jid)

// Mark chat as unread
await sock.chatModify(
    { markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Delete chat
await sock.chatModify(
    { delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Set disappearing messages in a group
await sock.sendMessage(jid, {
    disappearingMessagesInChat: true  // use WA_DEFAULT_EPHEMERAL (7 days)
})
// Or disable
await sock.sendMessage(jid, {
    disappearingMessagesInChat: false
})
// Or custom duration (in seconds)
await sock.sendMessage(jid, {
    disappearingMessagesInChat: 24 * 60 * 60  // 24 hours
})
```

---

## User Queries

### Check WhatsApp Availability

```javascript
// Single number
const [result] = await sock.onWhatsApp('628xxxxxxxxx@s.whatsapp.net')
if (result?.exists) {
    console.log('User is on WhatsApp! LID:', result.lid)
} else {
    console.log('Number not found on WhatsApp')
}

// Batch lookup
const results = await sock.onWhatsApp(
    '628111111111@s.whatsapp.net',
    '628222222222@s.whatsapp.net',
    '628333333333@s.whatsapp.net'
)
results.forEach(r => console.log(r.jid, r.exists))
```

### Fetch Profile Picture

```javascript
// Preview size (smaller)
const previewUrl = await sock.profilePictureUrl(jid, 'preview')

// Full size
const fullUrl = await sock.profilePictureUrl(jid, 'image')

console.log('Profile picture URL:', fullUrl || 'No picture')
```

### Fetch Status Text

```javascript
const statuses = await sock.fetchStatus(jid)
if (statuses && statuses.length > 0) {
    console.log('Status:', statuses[0].status)
    console.log('Set at:', new Date(statuses[0].setAt * 1000))
}
```

### Fetch Disappearing Duration

```javascript
const durations = await sock.fetchDisappearingDuration(jid)
console.log('Disappearing duration:', durations)
```

---

## Change Profile

```javascript
const fs = require('fs')

// Update display name
await sock.updateProfileName('Yebail Bot 🤖')

// Update status text (bio)
await sock.updateProfileStatus('Running on @yemo-dev/yebail 🚀')

// Update profile picture (own)
await sock.updateProfilePicture(sock.authState.creds.me.id, fs.readFileSync('./avatar.jpg'))

// Update profile picture of a group (requires admin)
await sock.updateProfilePicture(groupJid, fs.readFileSync('./group-icon.jpg'))

// Remove profile picture
await sock.removeProfilePicture(sock.authState.creds.me.id)
```

---

## Privacy Settings

```javascript
// Last seen: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateLastSeenPrivacy('contacts')

// Online status: 'all' | 'match_last_seen'
await sock.updateOnlinePrivacy('match_last_seen')

// Profile picture: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateProfilePicturePrivacy('contacts')

// Status/Story: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateStatusPrivacy('contacts')

// Read receipts: 'all' | 'none'
await sock.updateReadReceiptsPrivacy('all')

// Group add: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateGroupsAddPrivacy('contacts')

// Messages (who can message you): 'all' | 'contacts'
await sock.updateMessagesPrivacy('all')

// Calls: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateCallPrivacy('contacts')

// Default disappearing mode (in seconds): 0 = off, 86400 = 1 day, 604800 = 7 days, 7776000 = 90 days
await sock.updateDefaultDisappearingMode(604800)

// Disable link previews in chats
await sock.updateDisableLinkPreviewsPrivacy(true)
```

---

## Block / Unblock

```javascript
// Fetch blocklist
const blocklist = await sock.fetchBlocklist()
console.log('Blocked numbers:', blocklist)

// Block a contact
await sock.updateBlockStatus('628xxxxxxxxx@s.whatsapp.net', 'block')

// Unblock a contact
await sock.updateBlockStatus('628xxxxxxxxx@s.whatsapp.net', 'unblock')
```

---

## Groups

### Create a Group

```javascript
const group = await sock.groupCreate(
    'My Yebail Group',   // group subject / name
    [
        '628111111111@s.whatsapp.net',
        '628222222222@s.whatsapp.net'
    ]
)
console.log('Group created, JID:', group.id)
console.log('Members:', group.participants.map(p => p.id))
```

### Leave a Group

```javascript
await sock.groupLeave(groupJid)
```

### Update Group Subject

```javascript
await sock.groupUpdateSubject(groupJid, 'New Group Name 🔥')
```

### Update Group Description

```javascript
await sock.groupUpdateDescription(groupJid, 'This is the official Yebail test group.')

// Delete description
await sock.groupUpdateDescription(groupJid, null)
```

### Add / Remove Participants

```javascript
// Add members
const addResult = await sock.groupParticipantsUpdate(
    groupJid,
    ['628xxx@s.whatsapp.net', '628yyy@s.whatsapp.net'],
    'add'
)
console.log('Add result:', addResult) // [{ status: '200', jid: '...' }, ...]

// Remove members
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'remove')
```

### Promote / Demote Admins

```javascript
// Promote to admin
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'promote')

// Demote from admin
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'demote')
```

### Invite Code

```javascript
const code = await sock.groupInviteCode(groupJid)
console.log('Invite link: https://chat.whatsapp.com/' + code)
```

### Revoke Invite Code

```javascript
const newCode = await sock.groupRevokeInvite(groupJid)
console.log('New invite code:', newCode)
```

### Accept Invite

```javascript
// Accept invite by code
const joinedGroupJid = await sock.groupAcceptInvite('INVITE_CODE_HERE')
console.log('Joined group:', joinedGroupJid)
```

### Get Invite Info

```javascript
// Preview group info before joining
const info = await sock.groupGetInviteInfo('INVITE_CODE_HERE')
console.log('Group name:', info.subject)
console.log('Members:', info.size)
```

### Accept Invite V4 (from message)

```javascript
// When you receive a GroupInviteMessage in messages.upsert:
sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (msg.message?.groupInviteMessage) {
        const inviteMsg = msg.message.groupInviteMessage
        const joinedJid = await sock.groupAcceptInviteV4(msg.key, inviteMsg)
        console.log('Joined:', joinedJid)
    }
})
```

### Revoke Invite V4

```javascript
// Revoke an invite you sent to a specific user
await sock.groupRevokeInviteV4(groupJid, '628xxx@s.whatsapp.net')
```

### Join Requests (Approval Mode)

```javascript
// Enable join approval (only admins can approve new members)
await sock.groupJoinApprovalMode(groupJid, 'on')  // or 'off'

// Get pending join requests
const requests = await sock.groupRequestParticipantsList(groupJid)
console.log('Pending requests:', requests)

// Approve a request
await sock.groupRequestParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'approve')

// Reject a request
await sock.groupRequestParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'reject')
```

### Group Settings

```javascript
// Lock group settings (only admins can edit info)
await sock.groupSettingUpdate(groupJid, 'announcement') // admins only can send messages
await sock.groupSettingUpdate(groupJid, 'not_announcement') // all members can send

// Lock group info (only admins can edit)
await sock.groupSettingUpdate(groupJid, 'locked')
await sock.groupSettingUpdate(groupJid, 'unlocked')

// Control who can add members: 'all_member_add' | 'admin_add_mode'
await sock.groupMemberAddMode(groupJid, 'all_member_add')
```

### Ephemeral Messages in Group

```javascript
// Enable ephemeral (disappearing) messages – 7 days
await sock.groupToggleEphemeral(groupJid, 604800)

// 24 hours
await sock.groupToggleEphemeral(groupJid, 86400)

// 90 days
await sock.groupToggleEphemeral(groupJid, 7776000)

// Disable ephemeral
await sock.groupToggleEphemeral(groupJid, 0)
```

### Fetch Group Metadata

```javascript
const meta = await sock.groupMetadata(groupJid)
console.log({
    id:          meta.id,
    subject:     meta.subject,
    description: meta.desc,
    owner:       meta.owner,
    size:        meta.size,
    restrict:    meta.restrict,    // only admins can edit group info
    announce:    meta.announce,    // only admins can send messages
    ephemeral:   meta.ephemeralDuration,
    participants: meta.participants.map(p => ({
        id: p.id,
        admin: p.admin // null | 'admin' | 'superadmin'
    }))
})
```

### Fetch All Participating Groups

```javascript
const groups = await sock.groupFetchAllParticipating()
for (const [jid, meta] of Object.entries(groups)) {
    console.log(`${meta.subject} — ${jid} (${meta.participants.length} members)`)
}
```

---

## Community Features

```javascript
// Create a community
const community = await sock.communityCreate(
    'Yebail Community',
    'Welcome! This is the official Yebail community.'
)
console.log('Community:', community)

// Get community metadata
const meta = await sock.communityMetadata(communityJid)

// Update community name
await sock.communityUpdateSubject(communityJid, 'New Community Name')

// Update community description
await sock.communityUpdateDescription(communityJid, 'Updated description.')

// Create a subgroup inside a community
const subGroup = await sock.communityCreateGroup(
    'Study Room',
    ['628xxx@s.whatsapp.net'],
    communityJid
)

// Link an existing group to a community
await sock.communityLinkGroup(existingGroupJid, communityJid)

// Unlink a group from a community
await sock.communityUnlinkGroup(existingGroupJid, communityJid)

// Fetch linked groups of a community
const { communityJid: cJid, linkedGroups } = await sock.communityFetchLinkedGroups(communityJid)
console.log('Linked groups:', linkedGroups.map(g => g.subject))

// Add participants to community
await sock.communityParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'add')

// Remove participants from community
await sock.communityParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'remove')

// Get community invite code
const code = await sock.communityInviteCode(communityJid)
console.log('Community invite: https://chat.whatsapp.com/' + code)

// Revoke community invite code
const newCode = await sock.communityRevokeInvite(communityJid)

// Get pending join requests
const requests = await sock.communityRequestParticipantsList(communityJid)

// Approve join request
await sock.communityRequestParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'approve')

// Leave a community
await sock.communityLeave(communityJid)
```

---

## Newsletter

### Create a Newsletter

```javascript
const newsletter = await sock.newsletterCreate(
    'My Official Channel',       // name
    'Latest updates & news 📰', // description
    // optionally pass a Buffer for the picture:
    // fs.readFileSync('./channel-logo.jpg')
)
console.log('Newsletter ID:', newsletter.id)
console.log('Newsletter name:', newsletter.name)
```

### Newsletter Actions

```javascript
// Follow a newsletter
await sock.newsletterFollow(newsletterJid)

// Unfollow
await sock.newsletterUnfollow(newsletterJid)

// Mute
await sock.newsletterMute(newsletterJid)

// Unmute
await sock.newsletterUnmute(newsletterJid)

// Subscribe to live updates
await sock.subscribeNewsletterUpdates(newsletterJid)
```

### Update Newsletter

```javascript
// Change newsletter name
await sock.newsletterUpdateName(newsletterJid, 'New Channel Name 🚀')

// Change description
await sock.newsletterUpdateDescription(newsletterJid, 'Fresh new description!')

// Update picture
await sock.newsletterUpdatePicture(newsletterJid, fs.readFileSync('./logo.jpg'))

// Remove picture
await sock.newsletterRemovePicture(newsletterJid)

// Enable/disable reactions
await sock.newsletterReactionMode(newsletterJid, 'all')    // allow all reactions
await sock.newsletterReactionMode(newsletterJid, 'basic')  // basic reactions only
await sock.newsletterReactionMode(newsletterJid, 'none')   // no reactions
```

### Fetch Newsletter Messages

```javascript
// Fetch latest 10 messages
const messages = await sock.newsletterFetchMessages('jid', newsletterJid, 10)
for (const item of messages) {
    console.log('Server ID:', item.server_id)
    console.log('Views:', item.views)
    console.log('Reactions:', item.reactions)
}

// Fetch updates (view counts & reactions since last check)
const updates = await sock.newsletterFetchUpdates(newsletterJid, 10)
```

### React to Newsletter Message

```javascript
// React with emoji
await sock.newsletterReactMessage(newsletterJid, 'SERVER_ID', '❤️')

// Remove reaction (pass null or empty code)
await sock.newsletterReactMessage(newsletterJid, 'SERVER_ID', null)
```

### Newsletter Admin Management

```javascript
// Get newsletter metadata
const meta = await sock.newsletterMetadata('JID', newsletterJid)
console.log('Name:', meta.name)
console.log('Subscribers:', meta.subscribers)
console.log('Verification:', meta.verification)

// Get admin count
const count = await sock.newsletterAdminCount(newsletterJid)
console.log('Admin count:', count)

// Transfer ownership to another user
await sock.newsletterChangeOwner(newsletterJid, '628xxx@s.whatsapp.net')

// Demote an admin
await sock.newsletterDemote(newsletterJid, '628xxx@s.whatsapp.net')

// Delete newsletter permanently
await sock.newsletterDelete(newsletterJid)
```

---

## Business Profile

```javascript
// Fetch business profile
const profile = await sock.getBusinessProfile('628xxx@s.whatsapp.net')
console.log('Business name:', profile?.address)
console.log('Email:', profile?.email)
console.log('Description:', profile?.description)
console.log('Website:', profile?.website)

// Update your own business profile (WhatsApp Business accounts only)
await sock.updateBussinesProfile({
    address: '123 Main Street, Jakarta',
    email: 'contact@mybusiness.com',
    description: 'Official WhatsApp Business account.',
    websites: ['https://mybusiness.com'],
    hours: {
        timezone: 'Asia/Jakarta',
        days: [
            { day: 'MON', mode: 'specific_hours', openTimeInMinutes: 540, closeTimeInMinutes: 1080 },
            { day: 'TUE', mode: 'specific_hours', openTimeInMinutes: 540, closeTimeInMinutes: 1080 },
            { day: 'SAT', mode: 'open_24h' },
            { day: 'SUN', mode: 'closed' }
        ]
    }
})

// Update cover photo
await sock.updateCoverPhoto(fs.readFileSync('./cover.jpg'))

// Remove cover photo
await sock.removeCoverPhoto()
```

---

## Broadcast Lists & Stories

```javascript
// Send a text status/story to all contacts
await sock.sendMessage('status@broadcast', {
    text: 'Hello everyone! 👋',
    backgroundColor: '#FF5733',
    font: 3
}, {
    statusJidList: ['628xxx@s.whatsapp.net', '628yyy@s.whatsapp.net']
})

// Send an image story to specific contacts
await sock.sendMessage('status@broadcast', {
    image: { url: 'https://example.com/photo.jpg' },
    caption: 'Check out this photo!'
}, {
    statusJidList: ['628xxx@s.whatsapp.net']
})

// Status with mention (sends notification to mentioned user)
await sock.sendStatusMentions(
    { text: 'Hey @user, check this!' },
    ['628xxx@s.whatsapp.net']
)
```

---

## Label Management

```javascript
// Add a label to a chat
await sock.addChatLabel(jid, 'LABEL_ID')

// Remove a label from a chat
await sock.removeChatLabel(jid, 'LABEL_ID')

// Add a label to a specific message
await sock.addMessageLabel(jid, msg.key.id, 'LABEL_ID')

// Remove a label from a specific message
await sock.removeMessageLabel(jid, msg.key.id, 'LABEL_ID')
```

---

## Bot Features

```javascript
// Get list of available WhatsApp bots
const bots = await sock.getBotListV2()
console.log('Available bots:', bots)
// Returns: [{ jid: 'xxx@s.whatsapp.net', personaId: '...' }, ...]

// Send a message to a bot (AI assistant)
await sock.sendMessage(jid, {
    text: 'Hello, what can you help me with today?',
    ai: true // marks message as AI interaction
})
```

---

## Call Link

```javascript
// Create a video call link
const token = await sock.createCallLink('video')
console.log('Video call link token:', token)

// Create an audio call link
const audioToken = await sock.createCallLink('audio')
console.log('Audio call link token:', audioToken)

// Create an event call link
const eventToken = await sock.createCallLink('video', {
    startTime: Math.floor(Date.now() / 1000) + 3600 // event starts in 1 hour
})
```

---

## Writing Custom Functionality

### Enabling Debug Level in Logs

```javascript
const pino = require('pino')
const sock = makeWASocket({
    logger: pino({ level: 'debug' })
})
```

### Register Callback for Websocket Events

For advanced protocol handling, you can listen to binary nodes directly.

```javascript
// Listen to all edge routing events
sock.ws.on('CB:edge_routing', (node) => {
    console.log('Edge routing node:', node)
})

// Listen to any IQ result
sock.ws.on('CB:iq', (node) => {
    console.log('IQ received:', node.attrs)
})

// Listen to call events
sock.ws.on('CB:call', (node) => {
    console.log('Call node:', node)
})
```

### Contact Management

```javascript
// Add or edit a contact
await sock.addOrEditContact(jid, {
    notify: 'John Doe',
    verifiedName: 'John Doe Verified'
})

// Remove a contact
await sock.removeContact(jid)
```

### Quick Replies (Business)

```javascript
// Add or edit a quick reply shortcut
await sock.addOrEditQuickReply({
    shortcut: 'hello',
    message: 'Hello! How can I help you today? 😊',
    timestamp: Date.now()
})

// Remove a quick reply
await sock.removeQuickReply(timestamp)
```

### Member Label in Groups

```javascript
// Assign a label (tag) to a group member
await sock.updateMemberLabel(groupJid, 'Custom Member Tag')
```

