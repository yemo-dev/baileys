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
    - [Non-Media Messages](#non-media-messages)
    - [Sending with Link Preview](#sending-with-link-preview)
    - [Media Messages](#media-messages)
- [Modify Messages](#modify-messages)
- [Manipulating Media Messages](#manipulating-media-messages)
- [Reject Call](#reject-call)
- [Send States in Chat](#send-states-in-chat)
- [Modifying Chats](#modifying-chats)
- [User Querys](#user-querys)
- [Change Profile](#change-profile)
- [Groups](#groups)
- [Newsletter](#newsletter)
- [Privacy](#privacy)
- [Broadcast Lists & Stories](#broadcast-lists--stories)
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
const NodeCache = require('node-cache')
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
const { DisconnectReason, useMultiFileAuthState } = require("@yemo-dev/yebail");
const { Boom } = require('@hapi/boom');

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
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
sock.ev.on('messages.update', async (event) => {
    for(const { key, update } of event) {
        if(update.pollUpdates) {
            const pollCreation = await getMessage(key)
            if(pollCreation) {
                const votes = getAggregateVotesInPollMessage({
                    message: pollCreation,
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
```

---

## Whatsapp IDs Explain

- **JID**: Jabber ID. The format is generally `[country][number]@s.whatsapp.net`.
- **Groups**: `[creator-number]-[timestamp]@g.us`.
- **Newsletter**: `[id]@newsletter`.
- **LID**: Modern identity-based ID used by yebail for better authentication tracking.

---

## Utility Functions

- `getContentType(msg)`: Quickly find out if a message is text, image, etc.
- `downloadMediaMessage(msg, 'buffer')`: Download media content.
- `generateMessageID()`: Generate a unique ID for a new message.

## Batch Contact Lookup

You can verify many IDs at once.

```javascript
const result = await sock.onWhatsApp([
    '6281111111111@s.whatsapp.net',
    '6282222222222@s.whatsapp.net'
])

console.log(result)
```

## Account Restriction Check

Use this before sending if you want to inspect timelock or message cap status.

```javascript
const restriction = await sock.checkAccountRestriction()

console.log(restriction.isRestricted)
console.log(restriction.reachoutTimelock)
console.log(restriction.messageCap)
```

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

### Non-Media Messages

#### Buttons Message
Standard buttons for quick interactions.
```javascript
await sock.sendMessage(jid, {
    text: "Select an option:",
    footer: "yebail example",
    buttons: [
        { buttonId: 'id1', buttonText: { displayText: 'Option 1' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: 'Option 2' }, type: 1 }
    ],
    headerType: 1
})
```

#### Buttons Flow (Native Flow)
Modern interactive buttons with advanced components.
```javascript
await sock.sendMessage(jid, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                header: { title: "Title" },
                body: { text: "Body Content" },
                footer: { text: "Footer" },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({
                                title: "Choose one",
                                sections: [{
                                    title: "Group 1",
                                    rows: [{ title: "Item 1", id: "1" }]
                                }]
                            })
                        }
                    ]
                }
            }
        }
    }
})
```

#### Quote / Reply
Replying to a specific message.
```javascript
await sock.sendMessage(jid, { text: 'Replying to you' }, { quoted: m })
```

#### Mention Status
Creating a status update that mentions specific people (triggers notification).
```javascript
await sock.sendStatusMentions({ text: "Checking my new status!" }, [ '628xxx@s.whatsapp.net' ])
```

#### Send Album Message
Groups multiple media items (images/videos) into an album.
```javascript
await sock.sendAlbumMessage(jid, [
    { image: { url: 'img1.jpg' }, caption: 'Caption 1' },
    { image: { url: 'img2.jpg' }, caption: 'Caption 2' }
])
```

#### Carousel Message
Horizontally scrollable cards with media and text.
```javascript
await sock.sendMessage(jid, {
    text: 'Check these out:',
    cards: [
        { title: 'Card 1', image: { url: 'image1.jpg' }, caption: 'Desc 1' },
        { title: 'Card 2', image: { url: 'image2.jpg' }, caption: 'Desc 2' }
    ],
    viewOnce: true
})
```

#### Request Payment
```javascript
await sock.sendMessage(jid, {
    requestPayment: {      
       currency: "IDR",
       amount: "1000000",
       from: "admin@s.whatsapp.net",
       note: "Payment for services"
    }
})
```

---

## Modify Messages

### Deleting Messages
Delete a message for everyone in the chat.
```javascript
await sock.sendMessage(jid, { delete: m.key })
```

### Editing Messages
```javascript
await sock.sendMessage(jid, { text: 'Fixed the typo!', edit: m.key })
```

---

## User Queries

### Check if ID exists on WhatsApp
```javascript
const [result] = await sock.onWhatsApp('628xxx@s.whatsapp.net')
if(result?.exists) console.log('User is on WhatsApp!')
```

### Fetch Profile Picture
```javascript
const url = await sock.profilePictureUrl(jid, 'image')
console.log('Profile picture URL:', url)
```

---

## Groups

### Create a Group
```javascript
const group = await sock.groupCreate('My Cool Group', ['628xxx@s.whatsapp.net'])
```

### Add/Remove Participants
```javascript
await sock.groupParticipantsUpdate(jid, ['628xxx@s.whatsapp.net'], 'add') // or 'remove'
```

### Get Invite Code
```javascript
const code = await sock.groupInviteCode(jid)
console.log('Invite link: https://chat.whatsapp.com/' + code)
```

---

## Newsletter

### Create a Newsletter
```javascript
const res = await sock.newsletterCreate('My Channel', 'This is my official channel')
```

### Newsletter Actions
```javascript
await sock.newsletterFollow(jid)
await sock.newsletterMute(jid)
await sock.newsletterUpdateName(jid, 'New Channel Name')
```

---

## Privacy

### Privacy Settings
```javascript
await sock.updateLastSeenPrivacy('contacts')
await sock.updateProfilePicturePrivacy('none')
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
sock.ws.on('CB:edge_routing', (node) => {
    // Process raw node
})
```
