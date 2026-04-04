# @yemo-dev/yebail

**@yemo-dev/yebail** is a high-performance, WebSocket-based WhatsApp Web API library. It is a specialized, feature-rich distribution of Baileys, optimized for interactive messages and automated version tracking.

> [!NOTE]
> **Mengapa yebail bknnya yebails?**
> Karena `yebail` adalah suksesor dari `yebails` yang mendukung fitur pesan interaktif lebih lengkap (seperti full button, native flow, dll) dan optimalisasi untuk WhatsApp versi terbaru.

> [!TIP]
> This version is maintained with an **Auto-Update** system that tracks the latest WhatsApp Web revisions to ensure continuous compatibility.

## Disclaimer

This project is not affiliated with WhatsApp. Do not spam or use the library in ways that violate WhatsApp terms. Use at your own discretion.

## Install

From npm:

```bash
npm install @yemo-dev/yebail
```

Using npm alias (recommended for consistency):

```bash
npm install npm:@yemo-dev/yebail@latest
```

## Import

After installing from npm, the module name is `@yemo-dev/yebail`:

```js
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestWaWebVersion,
    makeInMemoryStore,
    Browsers,
    getContentType,
    downloadMediaMessage,
    getAggregateVotesInPollMessage
} = require('@yemo-dev/yebail')
```

From a local clone:

```js
const makeWASocket = require('./lib').default
```

TypeScript / ESM depends on your bundler.

## Usage

Check the `Example/` directory for a full interactive bot that demonstrates **all** APIs.

---

## Basic Connection (QR Code)

```js
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestWaWebVersion,
    Browsers
} = require('@yemo-dev/yebail')
const { Boom } = require('@hapi/boom')

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const { version } = await fetchLatestWaWebVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.ubuntu('MyBot'),
        printQRInTerminal: true,
        markOnlineOnConnect: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true
            if (shouldReconnect) connectToWhatsApp()
        } else if (connection === 'open') {
            console.log('Connection opened!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const msg = messages[0]
        if (!msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! 👋' })
        }
    })
}

connectToWhatsApp()
```

---

## Connect with Pairing Code (No QR)

```js
const sock = makeWASocket({ printQRInTerminal: false, auth: state })

if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode('628xxxxxxxxx') // no + or spaces
    console.log('Pairing code:', code)
}
```

---

## In-Memory Store

```js
const { makeInMemoryStore } = require('@yemo-dev/yebail')

const store = makeInMemoryStore({})
store.readFromFile('./baileys_store.json')
setInterval(() => store.writeToFile('./baileys_store.json'), 10_000)

// Attach to socket
store.bind(sock.ev)

// Load a message
const msg = await store.loadMessage(jid, messageId)
```

---

## Authentication storage

**@yemo-dev/yebail** does **not** mandate where session data lives. Credentials and Signal keys are exposed as JSON via the same `state` / `saveCreds` API whether you use files, SQLite, or a remote database.

| API | Use case |
| --- | --- |
| `useMultiFileAuthState` | Standard filesystem storage (best for local use) |
| Custom implementation | Redis, MongoDB, SQLite, etc. |

---

## Sending Messages

### Text

```js
await sock.sendMessage(jid, { text: 'Hello World! 👋' })
```

### Reply / Quote

```js
await sock.sendMessage(jid, { text: 'This is a reply!' }, { quoted: msg })
```

### Mention Users

```js
await sock.sendMessage(jid, {
    text: 'Hello @628111111111!',
    mentions: ['628111111111@s.whatsapp.net']
})
```

### Image

```js
// From URL
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/photo.jpg' },
    caption: 'A photo 📸'
})

// From buffer
const fs = require('fs')
await sock.sendMessage(jid, {
    image: fs.readFileSync('./photo.jpg'),
    caption: 'From local file'
})
```

### Video & GIF

```js
// Video
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/video.mp4' },
    caption: 'Watch this 🎬'
})

// GIF
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/anim.mp4' },
    gifPlayback: true
})
```

### Voice Note (PTT)

```js
await sock.sendMessage(jid, {
    audio: { url: 'https://example.com/voice.ogg' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true
})
```

### Document

```js
await sock.sendMessage(jid, {
    document: { url: 'https://example.com/file.pdf' },
    mimetype: 'application/pdf',
    fileName: 'report.pdf',
    caption: 'Monthly report 📄'
})
```

### Sticker

```js
await sock.sendMessage(jid, {
    sticker: { url: 'https://example.com/sticker.webp' }
})
```

### Location

```js
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        name: 'Jakarta, Indonesia',
        address: 'DKI Jakarta, Indonesia'
    }
})
```

### Poll

```js
await sock.sendMessage(jid, {
    poll: {
        name: 'Favorite fruit?',
        values: ['🍎 Apple', '🍌 Banana', '🍇 Grape'],
        selectableCount: 1
    }
})
```

### Reaction

```js
await sock.sendMessage(jid, {
    react: { text: '❤️', key: msg.key }
})
```

### List Message

```js
await sock.sendMessage(jid, {
    listMessage: {
        title: 'Choose an option',
        text: 'Select from the list below:',
        footerText: 'Yebail',
        buttonText: 'Open',
        listType: 1,
        sections: [
            {
                title: 'Options',
                rows: [
                    { title: 'Option 1', rowId: 'opt1' },
                    { title: 'Option 2', rowId: 'opt2' }
                ]
            }
        ]
    }
})
```

### Buttons (Native Flow)

```js
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: { title: 'Quick Reply', hasMediaAttachment: false },
        body: { text: 'How are you?' },
        footer: { text: 'Yebail' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '😊 Good', id: 'good' })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '😔 Bad', id: 'bad' })
                }
            ],
            messageParamsJson: ''
        }
    }
})
```

### Album (Multi-Media)

```js
await sock.sendAlbumMessage(jid, [
    { image: { url: 'https://picsum.photos/800/600?1' }, caption: 'Photo 1' },
    { image: { url: 'https://picsum.photos/800/600?2' }, caption: 'Photo 2' },
    { video: { url: 'https://example.com/clip.mp4' } }
])
```

### Status with Mention

```js
await sock.sendStatusMentions(
    { text: '🚀 Testing yebail!' },
    ['628xxx@s.whatsapp.net']
)
```

### Edit & Delete Messages

```js
// Edit
const sent = await sock.sendMessage(jid, { text: 'Original' })
await sock.sendMessage(jid, { text: 'Edited ✅', edit: sent.key })

// Delete for everyone
await sock.sendMessage(jid, { delete: sent.key })
```

---

## Groups

```js
// Create group
const group = await sock.groupCreate('My Group', ['628xxx@s.whatsapp.net'])

// Add/remove members
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'add')
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'remove')

// Promote / demote admins
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'promote')
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'demote')

// Invite link
const code = await sock.groupInviteCode(groupJid)
console.log('https://chat.whatsapp.com/' + code)

// Get metadata
const meta = await sock.groupMetadata(groupJid)

// Leave group
await sock.groupLeave(groupJid)
```

---

## Newsletter

```js
// Create
const nl = await sock.newsletterCreate('My Channel', 'Official updates')

// Follow / unfollow
await sock.newsletterFollow(newsletterJid)
await sock.newsletterUnfollow(newsletterJid)

// Mute / unmute
await sock.newsletterMute(newsletterJid)
await sock.newsletterUnmute(newsletterJid)

// Update channel
await sock.newsletterUpdateName(newsletterJid, 'New Channel Name')
await sock.newsletterUpdateDescription(newsletterJid, 'New description')

// React to a post
await sock.newsletterReactMessage(newsletterJid, 'SERVER_ID', '❤️')

// Delete channel
await sock.newsletterDelete(newsletterJid)
```

---

## Privacy Settings

```js
await sock.updateLastSeenPrivacy('contacts')        // 'all' | 'contacts' | 'none'
await sock.updateOnlinePrivacy('match_last_seen')   // 'all' | 'match_last_seen'
await sock.updateProfilePicturePrivacy('contacts')
await sock.updateStatusPrivacy('contacts')
await sock.updateReadReceiptsPrivacy('all')         // 'all' | 'none'
await sock.updateGroupsAddPrivacy('contacts')
await sock.updateCallPrivacy('contacts')
await sock.updateDefaultDisappearingMode(604800)    // seconds (0 = off)
```

---

## Profile

```js
await sock.updateProfileName('My Bot 🤖')
await sock.updateProfileStatus('Built with yebail 🚀')
await sock.updateProfilePicture(sock.authState.creds.me.id, fs.readFileSync('./avatar.jpg'))
await sock.removeProfilePicture(sock.authState.creds.me.id)
```

---

## Block / Unblock

```js
const list = await sock.fetchBlocklist()
await sock.updateBlockStatus('628xxx@s.whatsapp.net', 'block')
await sock.updateBlockStatus('628xxx@s.whatsapp.net', 'unblock')
```

---

## Presence (Typing, Online)

```js
await sock.sendPresenceUpdate('composing', jid)   // typing
await sock.sendPresenceUpdate('recording', jid)   // recording audio
await sock.sendPresenceUpdate('paused', jid)       // stopped typing
await sock.sendPresenceUpdate('available')         // set online
await sock.sendPresenceUpdate('unavailable')       // set offline
```

---

## Download Received Media

```js
const { downloadMediaMessage, getContentType } = require('@yemo-dev/yebail')

sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    const type = getContentType(msg.message)
    if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(type)) {
        const buffer = await downloadMediaMessage(msg, 'buffer', {})
        console.log('Downloaded', buffer.length, 'bytes')
    }
})
```

---

## Poll Vote Decryption

```js
const { getAggregateVotesInPollMessage } = require('@yemo-dev/yebail')

sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
        if (update.pollUpdates) {
            const pollMsg = await store.loadMessage(key.remoteJid, key.id)
            if (pollMsg) {
                const votes = getAggregateVotesInPollMessage({
                    message: pollMsg.message,
                    pollUpdates: update.pollUpdates
                })
                console.log('Poll results:', votes)
            }
        }
    }
})
```

---

## Detailed Examples

For a full list of code snippets covering every function, please refer to:
👉 **[EXAMPLES.md](./EXAMPLES.md)**

For a complete interactive bot implementation, see:
👉 **[Example/example.js](./Example/example.js)**

For the full feature list, see:
👉 **[BAILEYS_FEATURES.md](./BAILEYS_FEATURES.md)**

---

## Collapsible Docs (Merged for npm page)

<details>
<summary><strong>BAILEYS_FEATURES.md (Feature Index)</strong></summary>

- Supported message types
- Emoji reactions
- Sticker support
- Group features
- Business features
- Newsletter/channel features
- Community features
- Contact management
- Profile features
- Connectivity & authentication
- Advanced messaging features
- Chat management
- Polling & voting
- Special & unique features (including auto-update)
- Data & storage
- Event system
- Configuration options
- Utilities & helpers
- Message options
- WhatsApp ID formats
- Feature comparison summary
- Technology stack
- Code examples by feature category

Source: [BAILEYS_FEATURES.md](./BAILEYS_FEATURES.md)
</details>

<details>
<summary><strong>EXAMPLES.md (Examples Index)</strong></summary>

- Connecting account (QR / Pairing / Full history)
- Socket config notes (cache metadata, retry, notification behavior)
- Save auth info
- Event handling template
- Poll vote decryption
- Data store implementation
- WhatsApp ID explanation
- Utility functions
- Batch contact lookup
- Account restriction check
- Audio transcoding
- Sending messages (text, media, interactive, poll, status, etc.)
- Modify messages (edit/delete/pin/star)
- Manipulate media
- Read receipts
- Reject call
- Presence state updates
- Chat modifications
- User queries
- Profile/privacy updates
- Group operations
- Community features
- Newsletter operations
- Business profile
- Broadcast lists & stories
- Label management
- Bot features
- Call link
- Custom functionality examples

Source: [EXAMPLES.md](./EXAMPLES.md)
</details>

---

## Extra APIs

```javascript
const { transcodeAudio } = require('@yemo-dev/yebail')

// Check account restrictions
const restriction = await sock.checkAccountRestriction()
console.log('Is restricted:', restriction.isRestricted)

// Lookup multiple numbers
const results = await sock.onWhatsApp(
    '6281111111111@s.whatsapp.net',
    '6282222222222@s.whatsapp.net'
)

// Transcode audio before sending
const audio = await transcodeAudio('./voice.mp3', { bitrate: '64k' })
```
