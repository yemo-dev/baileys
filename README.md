# @yemo-dev/yebail

**@yemo-dev/yebail** is a high-performance, WebSocket-based WhatsApp Web API library. It is a specialized, feature-rich distribution of Baileys, optimized for interactive messages and automated version tracking.

> [!NOTE]
> **Mengapa yebail bknnya yebails?**
> Karena `yebail` adalah suksesor dari `yebails` yang mendukung fitur pesan interaktif lebih lengkap (seperti full button, native flow, dll) dan optimalisasi untuk WhatsApp versi terbaru.

> [!TIP]
> This version is maintained with an **Auto-Update** system that tracks the latest WhatsApp Web revisions to ensure continuous compatibility.

## Important Note

This README is temporary. A new guide is currently in development and this file will be replaced.

## Disclaimer

This project is not affiliated with WhatsApp. Do not spam or use the library in ways that violate WhatsApp terms. Use at your own discretion.

## Install

From npm:

```bash
npm install @yemo-dev/yebail
```

From GitHub:

```bash
npm install github:yemo-dev/baileys
```

## Import

After installing from npm, the module name is `@yemo-dev/yebail`:

```js
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestWaWebVersion 
} = require('@yemo-dev/yebail')
```

From a local clone:

```js
const makeWASocket = require('./lib').default
```

TypeScript / ESM depends on your bundler.

## Usage

Check the `Example/` directory for full implementations.

### Basic Connection

```js
const { default: makeWASocket, useMultiFileAuthState } = require('@yemo-dev/yebail')

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) connectToWhatsApp()
        } else if(connection === 'open') {
            console.log('opened connection')
            
            // Example: Send Status with Mention
            // This will trigger a private notification to the user
            await sock.sendStatusMentions({ text: 'Hello from Yebail!' }, ['628xxx@s.whatsapp.net'])
            
            // Example: Send Album
            await sock.sendAlbumMessage('628xxx@s.whatsapp.net', [
                { image: { url: 'https://example.com/1.jpg' }, caption: 'Image 1' },
                { video: { url: 'https://example.com/2.mp4' }, caption: 'Video 2' }
            ])
        }
    })
}

connectToWhatsApp()
```

### Authentication storage (filesystem, SQLite, cloud DB)

**@yemo-dev/yebail** does **not** mandate where session data lives. Credentials and Signal keys are exposed as JSON via the same `state` / `saveCreds` API whether you use files, SQLite, or a remote database.

| API | Use case |
| --- | --- |
| `useMultiFileAuthState` | Standard filesystem storage (best for local use) |
| `useCustomAuthState` | Your own implementation (Redis, MongoDB, etc.) |

## Features

**@yemo-dev/yebail** includes a wide range of features for interacting with the WhatsApp API:

### 🚀 Core Connectivity
- **QR Code & Pairing Code**: Connect via QR or an 8-character pairing code.
- **LID Mapping**: Full support for identity-based identifiers.
- **Session Persistence**: Built-in support for multi-file and custom authentication states.

### ✉️ Advanced Messaging
- **Status Mentions**: Mention users in status updates to trigger private notifications.
- **Album Messages**: Send multiple images/videos in a single grouped message.
- **Interactive Messages**: Full support for Buttons, Lists, and Native Flows.
- **Polls**: Create and track polls, with built-in vote aggregation.
- **32-Char Hex IDs**: Modern ID generation for better database indexing.
- **Batch Contact Lookup**: Check multiple WhatsApp IDs in one call.
- **Account Restriction Check**: Inspect reachout timelock and message cap state.

### 📁 Media & Utilities
- **Media Handling**: Efficient streaming for image, video, audio, and documents.
- **Audio Transcoding**: Optional helper to convert audio before sending.
- **Link Previews**: Automatic metadata generation for shared links.

## Detailed Examples

For a full list of code snippets covering everything from group management to newsletter actions, please refer to:
👉 **[EXAMPLES.md](./EXAMPLES.md)**

---

### Basic Usage Example

```javascript
const makeWASocket = require('@yemo-dev/yebail').default
const { useMultiFileAuthState } = require('@yemo-dev/yebail')

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if(connection === 'open') {
            console.log('Opened connection')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2))
    })
}

connectToWhatsApp()
```

### Extra APIs

```javascript
const { transcodeAudio } = require('@yemo-dev/yebail')

const restriction = await sock.checkAccountRestriction()
const lookup = await sock.onWhatsApp([
    '6281111111111@s.whatsapp.net',
    '6282222222222@s.whatsapp.net'
])
const audio = await transcodeAudio('./voice.mp3', { bitrate: '64k' })
```
