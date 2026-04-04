# @yemo-dev/yebail

[![npm version](https://img.shields.io/npm/v/@yemo-dev/yebail.svg)](https://www.npmjs.com/package/@yemo-dev/yebail)
[![npm downloads](https://img.shields.io/npm/dm/@yemo-dev/yebail.svg)](https://www.npmjs.com/package/@yemo-dev/yebail)
[![license](https://img.shields.io/npm/l/@yemo-dev/yebail.svg)](./LICENSE)

**@yemo-dev/yebail** adalah library WhatsApp Web API berbasis WebSocket yang cepat, stabil, dan fokus pada fitur interaktif modern.

> [!NOTE]
> `yebail` adalah suksesor `yebails` dengan dukungan fitur interaktif yang lebih lengkap dan penyesuaian ke versi WhatsApp Web terbaru.

> [!TIP]
> Proyek ini memiliki alur **manual release** dan **auto update** untuk menjaga kompatibilitas versi secara berkelanjutan.

## Disclaimer

Project ini tidak berafiliasi dengan WhatsApp. Gunakan secara bertanggung jawab dan jangan melanggar Terms of Service WhatsApp.

## Install

```bash
npm install @yemo-dev/yebail
```

Atau via npm alias:

```bash
npm install npm:@yemo-dev/yebail@latest
```

## Import

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

## Quick Start

```js
const { default: makeWASocket, useMultiFileAuthState, fetchLatestWaWebVersion, Browsers } = require('@yemo-dev/yebail')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestWaWebVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('MyBot'),
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)
}

start()
```

## Full Documentation (Merged)

Semua konten dari `BAILEYS_FEATURES.md` dan `EXAMPLES.md` sudah digabung penuh ke README ini.

<details>
<summary><strong>📘 Full BAILEYS_FEATURES Documentation (click to open)</strong></summary>

# Baileys (yebail) - Complete Feature List

**Project**: @yemo-dev/yebail - High-Performance WhatsApp Web API Library  
**Base**: Specialized distribution of Baileys with focus on interactive messages and version tracking  
**Version**: 3.0.1

---

## 1. SUPPORTED MESSAGE TYPES

### Text & Extended Messages
- **Text Messages**: Plain text conversation messages
- **Extended Text Messages**: Text with link preview, mentions, formatting
- **View-Once Messages**: Messages that disappear after being viewed (V1, V2, V2Extension)
- **Disappearing Messages**: Auto-deleting messages with custom durations

### Media Messages
- **Image Messages**: With captions, link preview, dimensions
- **Video Messages**: With captions, GIF support, PTT duration, view once
- **Audio Messages**: Standard audio + Push-To-Talk (PTT) support
- **Document Messages**: PDF, files with thumbnails and captions
- **Sticker Messages**: 
  - Regular stickers
  - Lottie/Animated stickers
  - Avatar stickers
- **Sticker Pack Messages**: Share sticker pack collections
- **Album/Collection Messages**: Multiple media items grouped (images/videos)
- **PTV Messages**: Push-to-Video messages

### Contact & Location
- **Contact Messages**: Single contact with vCard information
- **Contact Array Messages**: Multiple contacts in one message
- **Location Messages**: Geographic coordinates, address, name
- **Live Location Messages**: Real-time location sharing with updates

### Interactive Messages
- **Button Messages**: Standard clickable buttons with header, body, footer
- **List Messages**: Single-select or multi-select list options
- **Interactive Messages with Native Flow**: Advanced interactive components:
  - Single select dropdowns
  - Multi-select options
  - Payment flows
  - Catalog browsing
  - Location sending
  - Call permission requests
  - Automated greeting flows
- **Carousel Messages**: Horizontally scrollable cards with media and text

### Poll Messages
- **Poll Creation (V1, V2, V3)**: Multiple choice voting
- **Poll Updates**: Vote tracking and aggregation
- **Poll Results**: View count and voting breakdown
- **Decrypt Poll Votes**: Secure vote decryption

### Business/Product Messages
- **Product Messages**: Catalog product listings with images and details
- **Order Messages**: E-commerce order information
- **Payment Request Messages**: Request payment with amount, currency, note
- **Payment Invoice Messages**: Invoice information
- **Catalog Link Messages**: Links to business catalog
- **Product Link Messages**: Direct product links

### Status/Story Messages
- **Status Messages**: Status update distribution
- **Status Mentions**: Mention-based notifications in status updates

### Protocol/System Messages
- **Protocol Messages**: 
  - Edited message references
  - Revoke/Delete messages
  - Ephemeral setting changes
  - History sync notifications
  - App state sync key sharing
  - Peer data operation requests
  - LID migration mappings
  - Group member label changes
- **Forward Messages**: Forward message content with metadata
- **Template Messages**: Structured message templates
- **Keep in Chat Messages**: Pin important messages
- **Pin in Chat Messages**: Pin notifications

### Special Messages
- **Group Invite Messages**: Join group via code/link
- **Device-Sent Messages**: Multi-device message relay
- **Reaction Messages**: Emoji reactions to other messages
- **Shared Phone Number Message**: Contact sharing between accounts

---

## 2. EMOJI REACTIONS

- **React to Messages**: Send emoji/emoji reactions to any message
- **Reaction Types**: All WhatsApp-supported emoji reactions
- **Reaction Updates**: Live reaction tracking and removal
- **Reaction Aggregation**: View reaction counts and list of reactors
- **Newsletter Reactions**: Enable/disable reactions per newsletter

---

## 3. STICKER SUPPORT

- **Sticker Types**:
  - Regular WebP stickers
  - Lottie animated stickers (1p_sticker)
  - Avatar stickers
- **Sticker Packs**: Share and distribute sticker collections
- **Send Stickers**: Direct sticker transmission
- **Sticker Metadata**: Preserve sticker properties and metadata

---

## 4. GROUP FEATURES

### Group Management
- **Create Groups**: With initial participants and custom subject
- **Leave/Delete Groups**: Remove self or remove group
- **Update Group Subject**: Change group name/title
- **Update Group Description**: Add/modify group description

### Group Participants
- **Add Participants**: Invite users to group
- **Remove Participants**: Kick users from group
- **Participant Approval Requests**: Review and manage join requests
- **Approve/Reject Requests**: Accept or deny pending participants
- **Request Participant List**: Fetch pending approval requests

### Group Metadata & Settings
- **Fetch Group Metadata**: Get comprehensive group information
- **Metadata Caching**: Performance optimization with TTL-based cache
- **Group Invite Code**: Generate and manage invite links
- **Revoke Invite Code**: Invalidate old invite links
- **Accept Invite**: Join groups via invite code
- **Get Invite Info**: Fetch details before joining

### Group Settings
- **Member Add Mode**: Control who can add members (admin/all)
- **Join Approval Mode**: Require admin approval for member requests
- **Ephemeral Messages**: Set message disappearing duration
- **Group Settings Update**: Batch update multiple settings

---

## 5. BUSINESS FEATURES

### Business Profile
- **Update Business Profile**: 
  - Address
  - Email
  - Description
  - Websites
  - Business hours
  - Timezone configuration
- **Cover Photo**: Update and remove business cover images
- **Update Photo**: Change business profile picture

### Business Catalog
- **Get Catalog**: Retrieve product listings
- **Limit & Pagination**: Control catalog fetch with cursor-based pagination
- **Product Metadata**: Image dimensions and optimization

---

## 6. NEWSLETTER/CHANNEL FEATURES

### Newsletter Management
- **Create Newsletter**: New channel with name and description
- **Delete Newsletter**: Permanently remove channel
- **Update Name**: Change newsletter display name
- **Update Description**: Modify channel description
- **Update Picture**: Change newsletter avatar/icon
- **Remove Picture**: Delete custom newsletter picture

### Newsletter Interactions
- **Follow/Unfollow**: Subscribe/unsubscribe to channels
- **Mute/Unmute**: Control notification delivery
- **Subscribe to Updates**: Real-time update stream

### Newsletter Administration
- **Change Owner**: Transfer ownership to another user
- **Demote Admin**: Revoke admin privileges
- **Admin Management**: Track admin count
- **Delete Newsletter**: Permanent removal

### Newsletter Messages & Reactions
- **Fetch Messages**: Retrieve newsletter posts
- **Fetch Updates**: Get updates with view counts and reactions
- **React to Messages**: Send emoji reactions to newsletter posts
- **Message Analytics**: 
  - View count tracking
  - Reaction metrics
  - Engagement data
- **Reaction Mode**: Enable/disable reactions per newsletter

---

## 7. COMMUNITY FEATURES

### Community Management
- **Create Communities**: Establish new community structures
- **Delete/Leave Communities**: Remove communities
- **Update Subject**: Change community name
- **Update Description**: Modify community details
- **Community Metadata**: Fetch comprehensive community info

### Community Groups
- **Create Groups**: Create groups within communities
- **Link Groups**: Add existing groups to community
- **Unlink Groups**: Remove groups from community
- **Fetch Linked Groups**: List all community subgroups

### Community Participants
- **Add Participants**: Invite to community
- **Remove Participants**: Remove community members
- **Participant Approval Requests**: Manage join requests
- **Approve/Reject Requests**: Handle pending memberships

### Community Settings
- **Member Add Mode**: Control membership permissions
- **Join Approval Mode**: Require approval for new members
- **Ephemeral Messages**: Set disappearing message duration
- **Community Invite Code**: Generate and revoke invites
- **Accept Invite**: Join communities via code

---

## 8. CONTACT MANAGEMENT

### Contact Lookup & Verification
- **Check WhatsApp Availability**: Verify if users have WhatsApp accounts
- **Batch Verification**: Check multiple contacts simultaneously
- **LID Mapping**: Support for modern identity-based identifiers

### Profile Access
- **Fetch Profile Picture**: Get user profile photo with size variants
- **Update Profile Picture**: Change personal profile image
- **Profile Dimensions**: Customize image dimensions

### Contact Information
- **Phone Number Sharing**: Exchange phone numbers securely
- **Contact Details**: Store and retrieve contact information
- **Fetching Contact Status**: Check user online/offline status

---

## 9. PROFILE FEATURES

### Profile Customization
- **Update Profile Name**: Change display name
- **Update Profile Picture**: Set profile avatar
- **Profile Picture Variants**: Multiple size options for preview/full

### Privacy Controls
- **Last Seen Privacy**: Control who sees your last active time
  - Everyone / Contacts only / Nobody
- **Online Status Privacy**: Hide/show online indicator
- **Read Receipt Privacy**: Control read receipt visibility
- **Profile Picture Privacy**: Restrict who can see your profile image
- **Status Privacy**: Control who sees your status updates
- **Call Privacy**: Manage call visibility and permissions

### Account Settings
- **Disappearing Message Duration**: Set default auto-delete duration
- **Message Privacy**: Control who can message you
- **Group Add Privacy**: Restrict who can add you to groups
- **Disable Link Previews**: Toggle URL preview generation

---

## 10. CONNECTIVITY & AUTHENTICATION

### Connection Methods
- **QR Code Authentication**: Scan QR for quick login
- **Pairing Code**: 8-character code authentication (no QR needed)
- **Multi-Device Support**: Connect as secondary WhatsApp device
- **Session Persistence**: Save and restore sessions automatically

### Auth State Management
- **Multi-File Auth State**: Standard filesystem-based credentials
- **Custom Auth State**: Implement custom storage (Redis, MongoDB, etc.)
- **SQLite Auth State**: Database-backed credential storage
- **Credentials Update Events**: React to auth changes in real-time
- **LID Support**: Modern identity system support

### Connection Features
- **Auto-Reconnection**: Automatic reconnection on disconnect
- **Full History Sync**: Retrieve complete message history (requires desktop browser emulation)
- **Real-time Status**: Live connection state updates
- **Browser Emulation**: Customize browser name and platform

---

## 11. ADVANCED MESSAGING FEATURES

### Message Delivery & Status
- **Read Receipts**: Track message read status
- **Delivery Receipts**: Confirm message delivery
- **Typing Indicators**: Show when typing
- **Recording Indicators**: Show when recording
- **Online Status**: Display online/offline state

### Message Interaction
- **Edit Messages**: Modify sent messages
- **Delete Messages**: Revoke/hide messages
- **Quote/Reply**: Reference specific messages
- **Message Retry**: Automatic retry with configurable attempts
- **Message Caching**: Recent message cache for performance

### Media Handling
- **Download Messages**: Extract media from received messages
- **Link Previews**: Auto-generate metadata for URLs
- **Thumbnail Generation**: Create image previews
- **Media Compression**: Optimize media before sending
- **Media Upload**: Upload to WhatsApp media servers
- **Streaming Support**: Stream media without full download

### Message Features
- **Forward Messages**: Share messages with metadata intact
- **Batch Send**: Send to multiple recipients efficiently
- **Group Message**: Send to entire groups/communities
- **Status Distribution**: Post to status/story
- **Newsletter Posts**: Share to newsletter channels
- **Broadcast Lists**: Legacy broadcast distribution

---

## 12. CHAT MANAGEMENT

### Chat Operations
- **Modify Chat**: Archive, unarchive, delete, pin chats
- **Chat Metadata**: Fetch chat information and history
- **Chat Pinning**: Pin important conversations
- **Chat Archiving**: Organize inactive conversations
- **Disappearing Messages**: Configure per-chat auto-delete

### Chat Types
- **Direct Messages**: 1-to-1 conversations
- **Group Chats**: Multi-participant group conversations
- **Community Chats**: Community subgroup conversations
- **Newsletter Subscriptions**: Channel posts and updates
- **Broadcast Lists**: Legacy broadcast groups

---

## 13. POLLING & VOTING

### Poll Creation
- **Multiple Choice Polls**: Create survey questions
- **Poll Versions**: V1, V2, V3 with enhanced features
- **Custom Options**: Add answer choices
- **Anonymous Voting**: Privacy-preserving voting option (if supported)

### Poll Interaction
- **Vote in Polls**: Participate in voting
- **Change Vote**: Update your selection
- **Live Results**: Real-time vote aggregation
- **Vote Decryption**: Secure vote verification

### Poll Analytics
- **Vote Aggregation**: Calculate poll results
- **Participant Tracking**: See who voted
- **Real-time Updates**: Live vote count changes
- **Poll Closure**: End voting

---

## 14. SPECIAL & UNIQUE FEATURES

### Auto-Update System
- **Version Tracking**: Automatically track WhatsApp Web versions
- **Continuous Compatibility**: Update protocol support automatically
- **No Manual Version Management**: Stay compatible without manual updates

### Business & Bot Features
- **Bot Detection**: Identify bot accounts
- **Bot List**: Retrieve available bot services
- **Bot Interaction**: Send messages to bots
- **Business Node Filtering**: Anti-spam bot filtering
- **Catalog Link Handling**: Detect and handle catalog URLs
- **Product Link Detection**: Recognize product sharing links

### WebSocket & Protocol
- **Binary Node Handling**: Direct WebSocket protocol access
- **Custom Handlers**: Register callbacks for protocol events
- **Debug Logging**: Comprehensive protocol logging
- **Error Handling**: Robust error recovery

### Advanced Utilities
- **Generate Message IDs**: Customizable ID generation (32-char hex default)
- **Content Type Detection**: Identify message types
- **Message Normalization**: Convert between message formats
- **Event-Driven Architecture**: Reactive message handling
- **Mutex/Locking**: Prevent race conditions
- **Cache Management**: TTL-based caching system

### Audio & Media
- **Audio Transcoding**: Convert audio formats
- **Video Optimization**: Compress and optimize video
- **GIF Support**: Animate videos as GIFs
- **PTT (Push-to-Talk)**: Voice message support
- **Music Metadata**: Extract audio information

### Account Features
- **Account Reachout TimeCheck**: Verify account restrictions
- **Message Capping**: Track free message limits
- **Account Status**: Monitor account health
- **Device Management**: Handle multi-device sessions

---

## 15. DATA & STORAGE

### In-Memory Store
- **Chat Caching**: Store chats in memory
- **Contacts Storage**: Keep contact information
- **Message History**: Optional local message caching
- **Persistent Storage**: Save/restore from disk

### Authentication State Storage
- **Filesystem Storage**: Standard JSON file storage
- **Database Storage**: SQLite-backed persistence
- **Cloud Storage**: Custom remote implementation
- **Signal Keys**: Encryption key management
- **Credentials**: Session credentials storage

### Privacy & Encryption
- **End-to-End Encryption**: Signal protocol implementation
- **Sender Key Distribution**: Group message encryption
- **Message Encryption**: Secure message transmission
- **Key Management**: Automatic key rotation

---

## 16. EVENT SYSTEM

### Connection Events
- `connection.update`: Connection status changes (open, close, qr, pairing code)
- `creds.update`: Authentication state changes
- `messaging.history-set`: History sync events

### Message Events
- `messages.upsert`: New or updated messages
- `messages.update`: Message status changes (read, receipt)
- `messages.delete`: Message deletion notifications
- `message.reaction`: Emoji reaction events

### Chat Events
- `chats.upsert`: Chat creation/update
- `chats.delete`: Chat deletion
- `chats.update`: Chat metadata changes

### Group Events
- `groups.update`: Group information changes
- `group-participants.update`: Participant changes (add, remove, demote)

### Contact Events
- `contacts.upsert`: Contact information updates

### Status Events
- `status.update`: User status changes
- `call`: Incoming call events
- `notification`: System notifications

### Polling Events
- `poll-votes`: Changes in poll voting
- `poll-update`: Poll result updates

---

## 17. CONFIGURATION OPTIONS

### Socket Configuration
- `printQRInTerminal`: Display QR code for scanning
- `auth`: Authentication state object
- `browser`: Browser identification string
- `syncFullHistory`: Retrieve complete message history
- `markOnlineOnConnect`: Set online status on connection
- `generateMessageID`: Custom message ID function
- `cachedGroupMetadata`: Group metadata cache function
- `getMessage`: Message lookup function for retries
- `patchMessageBeforeSending`: Pre-process messages before sending
- `linkPreviewImageThumbnailWidth`: Thumbnail dimensions
- `generateHighQualityLinkPreview`: Enhanced link preview generation
- `enableRecentMessageCache`: Performance optimization
- `maxMsgRetryCount`: Maximum retry attempts
- `logger`: Custom logger instance

---

## 18. UTILITIES & HELPERS

### Message Utilities
- `getContentType()`: Identify message type
- `downloadMediaMessage()`: Extract media content
- `generateMessageID()`: Create unique message IDs
- `normalizeMessageContent()`: Standardize message format
- `extractMessageContent()`: Get inner message from wrapper
- `generateWAMessageContent()`: Create message content
- `generateWAMessage()`: Full message generation

### Decryption & Crypto
- `decryptMessageNode()`: Decrypt binary protocol messages
- `encryptMessage()`: Encrypt message data
- `getAggregateVotesInPollMessage()`: Process poll results

### Helper Functions
- `onWhatsApp()`: Check WhatsApp availability
- `checkExistence()`: Verify contact exists
- `parseBusinessProfile()`: Extract business info
- `generateProfilePicture()`: Create profile images
- `extractUrlFromText()`: Detect URLs in messages

---

## 19. MESSAGE OPTIONS

### Common Options
- `quoted`: Reply to a specific message
- `ephemeralExpiration`: Auto-delete duration
- `mentions`: Tag specific users
- `contextInfo`: Message context and metadata
- `header`: Message header content
- `footer`: Message footer text

### Media Options
- `caption`: Text for media messages
- `fileName`: Document file name
- `mediaType`: Media classification
- `mimetype`: MIME type specification
- `gifPlayback`: Loop video as GIF
- `ptt`: Mark audio as push-to-talk

---

## 20. WHATSAPP ID FORMATS

- **User JID**: `[country][number]@s.whatsapp.net` (e.g., `628xxxxx@s.whatsapp.net`)
- **Group JID**: `[creator-number]-[timestamp]@g.us`
- **Community JID**: `[community-id]@g.us` (community prefix)
- **Newsletter JID**: `[newsletter-id]@newsletter`
- **LID**: Modern identity-based identifier system
- **Broadcast List**: Legacy format for broadcasts

---

## FEATURE COMPARISON SUMMARY

| Feature Category | Support Level | Details |
|---|---|---|
| Text Messages | ✅ Full | Including extended with link preview |
| Media (Image, Video, Audio, Document) | ✅ Full | With compression and thumbnails |
| Stickers | ✅ Full | Regular, Lottie, Avatar stickers |
| Reactions/Emojis | ✅ Full | On any message type |
| Polls | ✅ Full | V1, V2, V3 with vote tracking |
| Buttons/Interactive | ✅ Full | Standard buttons, list, native flow |
| Carousel Messages | ✅ Full | Multi-card scrollable content |
| Group Management | ✅ Full | Create, manage, settings |
| Communities | ✅ Full | Create, link groups, manage |
| Business Features | ✅ Full | Profile, catalog, products, payment |
| Newsletter/Channels | ✅ Full | Create, manage, analytics |
| Contact Management | ✅ Full | Lookup, verification, sharing |
| Profile Features | ✅ Full | Update, privacy controls |
| Privacy Settings | ✅ Comprehensive | All major privacy categories |
| Message Editing | ✅ Yes | Modify after sending |
| Message Deletion | ✅ Yes | Revoke from all recipients |
| Disappearing Messages | ✅ Full | Custom durations, group settings |
| Album Messages | ✅ Yes | Multiple media grouped |
| Status/Stories | ✅ Yes | Including mentions |
| Multi-Device | ✅ Full | QR and pairing code support |
| History Sync | ✅ Yes | Full history with browser emulation |
| Encryption | ✅ Full | Signal protocol, proper key management |
| Auto-Updates | ✅ Yes | Version tracking system |

---

## TECHNOLOGY STACK

- **Protocol**: WhatsApp Web API (v2.2405+)
- **Encryption**: Signal Protocol (libsignal-node)
- **WebSocket**: ws (v8.13.0)
- **Binary Encoding**: protobufjs (v6.11.3)
- **Storage**: Custom implementations + SQLite support
- **Caching**: NodeCache with TTL support
- **Logging**: pino (v9.6)
- **HTTP Client**: axios (v1.6.0)

---

*This feature list represents the comprehensive capabilities of the Baileys/yebail library as of version 3.0.1, suitable for detailed comparison with other WhatsApp API solutions.*

---

## CODE EXAMPLES BY FEATURE CATEGORY

The following examples demonstrate how to use every major feature category.

### 1. Text & Extended Messages

```javascript
// Plain text
await sock.sendMessage(jid, { text: 'Hello World! 👋' })

// Text with bold/italic/strikethrough/code formatting
await sock.sendMessage(jid, {
    text: '*bold* _italic_ ~strikethrough~ ```monospace```'
})

// Text with URL (auto link preview)
await sock.sendMessage(jid, {
    text: 'Check https://github.com/yemo-dev/baileys for details'
})

// Mention users
await sock.sendMessage(jid, {
    text: 'Hello @628111111111 and @628222222222!',
    mentions: ['628111111111@s.whatsapp.net', '628222222222@s.whatsapp.net']
})
```

### 2. Media Messages

```javascript
// Image from URL
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/photo.jpg' },
    caption: 'Caption for image 📸'
})

// Image from file
const fs = require('fs')
await sock.sendMessage(jid, {
    image: fs.readFileSync('./photo.jpg'),
    caption: 'From local file'
})

// Video
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/video.mp4' },
    caption: 'Watch this! 🎬'
})

// GIF (looping video)
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/anim.mp4' },
    gifPlayback: true
})

// Audio
await sock.sendMessage(jid, {
    audio: { url: 'https://example.com/audio.mp3' },
    mimetype: 'audio/mp4'
})

// Voice note (PTT)
await sock.sendMessage(jid, {
    audio: { url: 'https://example.com/voice.ogg' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true
})

// Push-to-Video (round video)
await sock.sendMessage(jid, {
    video: { url: 'https://example.com/clip.mp4' },
    ptv: true
})

// Document
await sock.sendMessage(jid, {
    document: { url: 'https://example.com/file.pdf' },
    mimetype: 'application/pdf',
    fileName: 'report.pdf',
    caption: 'Monthly report 📄'
})

// Sticker (regular)
await sock.sendMessage(jid, {
    sticker: { url: 'https://example.com/sticker.webp' }
})

// View-once image
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/secret.jpg' },
    viewOnce: true
})
```

### 3. Sticker Support

```javascript
// Regular WebP sticker
await sock.sendMessage(jid, {
    sticker: fs.readFileSync('./sticker.webp')
})

// Animated (Lottie) sticker
await sock.sendMessage(jid, {
    sticker: fs.readFileSync('./sticker.tgs'),
    isLottie: true
})
```

### 4. Group Features

```javascript
// Create group
const group = await sock.groupCreate('My Group', ['628xxx@s.whatsapp.net'])
console.log('Group ID:', group.id)

// Leave group
await sock.groupLeave(groupJid)

// Update name
await sock.groupUpdateSubject(groupJid, 'New Group Name 🔥')

// Update description
await sock.groupUpdateDescription(groupJid, 'This is the updated group description.')

// Add members
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'add')

// Remove members
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'remove')

// Promote to admin
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'promote')

// Demote from admin
await sock.groupParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'demote')

// Get pending join requests
const requests = await sock.groupRequestParticipantsList(groupJid)

// Approve / reject requests
await sock.groupRequestParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'approve')
await sock.groupRequestParticipantsUpdate(groupJid, ['628xxx@s.whatsapp.net'], 'reject')

// Get metadata
const meta = await sock.groupMetadata(groupJid)

// Get invite code
const code = await sock.groupInviteCode(groupJid)
console.log('Invite: https://chat.whatsapp.com/' + code)

// Revoke invite
await sock.groupRevokeInvite(groupJid)

// Accept invite by code
const joinedJid = await sock.groupAcceptInvite('INVITE_CODE')

// Get invite info before joining
const info = await sock.groupGetInviteInfo('INVITE_CODE')

// Member add mode
await sock.groupMemberAddMode(groupJid, 'all_member_add')

// Join approval mode
await sock.groupJoinApprovalMode(groupJid, 'on')

// Toggle ephemeral
await sock.groupToggleEphemeral(groupJid, 604800) // 7 days

// Update group settings
await sock.groupSettingUpdate(groupJid, 'announcement') // only admins can send

// Fetch all groups
const groups = await sock.groupFetchAllParticipating()
```

### 5. Business Features

```javascript
// Get business profile
const profile = await sock.getBusinessProfile('628xxx@s.whatsapp.net')
console.log('Business:', profile)

// Update business profile (WhatsApp Business accounts only)
await sock.updateBussinesProfile({
    address: '123 Main Street, Jakarta',
    email: 'contact@mybusiness.com',
    description: 'Official WhatsApp Business account.',
    websites: ['https://mybusiness.com'],
    hours: {
        timezone: 'Asia/Jakarta',
        days: [
            { day: 'MON', mode: 'specific_hours', openTimeInMinutes: 540, closeTimeInMinutes: 1080 },
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

### 6. Newsletter / Channel Features

```javascript
// Create newsletter
const nl = await sock.newsletterCreate('My Channel', 'Official updates')
console.log('Newsletter ID:', nl.id)

// Delete newsletter
await sock.newsletterDelete(nl.id)

// Update name
await sock.newsletterUpdateName(nl.id, 'New Channel Name')

// Update description
await sock.newsletterUpdateDescription(nl.id, 'Updated description')

// Update picture
await sock.newsletterUpdatePicture(nl.id, fs.readFileSync('./logo.jpg'))

// Remove picture
await sock.newsletterRemovePicture(nl.id)

// Follow / unfollow
await sock.newsletterFollow(nl.id)
await sock.newsletterUnfollow(nl.id)

// Mute / unmute
await sock.newsletterMute(nl.id)
await sock.newsletterUnmute(nl.id)

// Subscribe to live updates
await sock.subscribeNewsletterUpdates(nl.id)

// Change owner
await sock.newsletterChangeOwner(nl.id, '628xxx@s.whatsapp.net')

// Demote admin
await sock.newsletterDemote(nl.id, '628xxx@s.whatsapp.net')

// Get admin count
const count = await sock.newsletterAdminCount(nl.id)

// Get metadata
const meta = await sock.newsletterMetadata('JID', nl.id)
console.log('Subscribers:', meta.subscribers)

// Fetch messages
const messages = await sock.newsletterFetchMessages('jid', nl.id, 10)

// Fetch updates
const updates = await sock.newsletterFetchUpdates(nl.id, 10)

// React to a post
await sock.newsletterReactMessage(nl.id, 'SERVER_ID', '❤️')

// Set reaction mode
await sock.newsletterReactionMode(nl.id, 'all')  // 'all' | 'basic' | 'none'
```

### 7. Community Features

```javascript
// Create community
const community = await sock.communityCreate('My Community', 'Welcome!')

// Get metadata
const meta = await sock.communityMetadata(communityJid)

// Update name / description
await sock.communityUpdateSubject(communityJid, 'New Name')
await sock.communityUpdateDescription(communityJid, 'New description')

// Create subgroup
await sock.communityCreateGroup('Study Room', ['628xxx@s.whatsapp.net'], communityJid)

// Link / unlink groups
await sock.communityLinkGroup(groupJid, communityJid)
await sock.communityUnlinkGroup(groupJid, communityJid)

// Fetch linked groups
const { linkedGroups } = await sock.communityFetchLinkedGroups(communityJid)

// Add / remove participants
await sock.communityParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'add')
await sock.communityParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'remove')

// Get invite code
const code = await sock.communityInviteCode(communityJid)

// Revoke invite
await sock.communityRevokeInvite(communityJid)

// Pending requests
const reqs = await sock.communityRequestParticipantsList(communityJid)
await sock.communityRequestParticipantsUpdate(communityJid, ['628xxx@s.whatsapp.net'], 'approve')

// Leave community
await sock.communityLeave(communityJid)
```

### 8. Contact Management

```javascript
// Check WhatsApp availability (single)
const [result] = await sock.onWhatsApp('628xxx@s.whatsapp.net')
console.log(result?.exists, result?.lid)

// Batch check
const results = await sock.onWhatsApp('628xxx@s.whatsapp.net', '628yyy@s.whatsapp.net')

// Fetch status text
const statuses = await sock.fetchStatus(jid)
console.log(statuses?.[0]?.status)

// Fetch disappearing duration
const durations = await sock.fetchDisappearingDuration(jid)

// Profile picture URL
const url = await sock.profilePictureUrl(jid, 'image')

// Add / edit contact
await sock.addOrEditContact(jid, { notify: 'John Doe' })

// Remove contact
await sock.removeContact(jid)
```

### 9. Profile Features

```javascript
// Update display name
await sock.updateProfileName('My Bot 🤖')

// Update status/bio
await sock.updateProfileStatus('Built with yebail 🚀')

// Update profile picture (own)
await sock.updateProfilePicture(sock.authState.creds.me.id, fs.readFileSync('./avatar.jpg'))

// Update group profile picture (admin required)
await sock.updateProfilePicture(groupJid, fs.readFileSync('./group-icon.jpg'))

// Remove profile picture
await sock.removeProfilePicture(sock.authState.creds.me.id)
```

### 10. Connectivity & Authentication

```javascript
// QR code connection
const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu('MyBot'),
    printQRInTerminal: true
})

// Pairing code connection
const sock2 = makeWASocket({ printQRInTerminal: false, auth: state })
const code = await sock2.requestPairingCode('628xxxxxxxxx')
console.log('Pairing code:', code)

// Full history sync
const sock3 = makeWASocket({
    auth: state,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: true
})

// Auto-reconnect
sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
        const shouldReconnect =
            (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true
        if (shouldReconnect) startSock()
    }
})
```

### 11. Advanced Messaging Features

```javascript
// Reply / quote
await sock.sendMessage(jid, { text: 'Replying!' }, { quoted: msg })

// Edit message
const sent = await sock.sendMessage(jid, { text: 'Original' })
await sock.sendMessage(jid, { text: 'Edited ✅', edit: sent.key })

// Delete message (for everyone)
await sock.sendMessage(jid, { delete: sent.key })

// Forward message
await sock.sendMessage(jid, { forward: msg, force: true })

// Pin message
await sock.sendMessage(jid, { pin: sent.key, type: 1 })

// Mark as read
await sock.readMessages([msg.key])

// Download received media
const { downloadMediaMessage } = require('@yemo-dev/yebail')
const buffer = await downloadMediaMessage(msg, 'buffer', {})
```

### 12. Chat Management

```javascript
// Archive chat
await sock.chatModify(
    { archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Pin chat
await sock.chatModify({ pin: true }, jid)

// Mute chat (8 hours)
await sock.chatModify({ mute: Date.now() + 8 * 60 * 60 * 1000 }, jid)

// Mark as unread
await sock.chatModify(
    { markRead: false, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Delete chat
await sock.chatModify(
    { delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] },
    jid
)

// Star a message
await sock.star(jid, [{ id: msg.key.id, fromMe: !!msg.key.fromMe }], true)

// Add label to chat
await sock.addChatLabel(jid, 'LABEL_ID')
await sock.removeChatLabel(jid, 'LABEL_ID')

// Add label to message
await sock.addMessageLabel(jid, msg.key.id, 'LABEL_ID')
await sock.removeMessageLabel(jid, msg.key.id, 'LABEL_ID')
```

### 13. Polling & Voting

```javascript
// Create poll
await sock.sendMessage(jid, {
    poll: {
        name: 'Favorite color?',
        values: ['🔴 Red', '🟢 Green', '🔵 Blue'],
        selectableCount: 1
    }
})

// Decrypt poll votes
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

### 14. Special & Unique Features

```javascript
// Status/Story with mention (triggers notification)
await sock.sendStatusMentions(
    { text: '🚀 Testing yebail!' },
    ['628xxx@s.whatsapp.net']
)

// Album message
await sock.sendAlbumMessage(jid, [
    { image: { url: 'https://picsum.photos/800/600?1' }, caption: 'Photo 1' },
    { image: { url: 'https://picsum.photos/800/600?2' }, caption: 'Photo 2' }
])

// Bot list
const bots = await sock.getBotListV2()
console.log('Bots:', bots)

// Send to bot / AI
await sock.sendMessage(jid, {
    text: 'What is the weather today?',
    ai: true
})

// Websocket event callback
sock.ws.on('CB:edge_routing', (node) => {
    console.log('Edge routing:', node)
})

// Payment request
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currencyCodeIso4217: 'IDR',
        amount1000: 100000 * 1000,
        requestFrom: sock.authState.creds.me.id,
        noteMessage: {
            extendedTextMessage: { text: 'Payment for services' }
        }
    }
})

// Create call link
const token = await sock.createCallLink('video')
console.log('Call link token:', token)
```

### 15. Data & Storage

```javascript
const { makeInMemoryStore } = require('@yemo-dev/yebail')

// In-memory store
const store = makeInMemoryStore({})
store.readFromFile('./baileys_store.json')
setInterval(() => store.writeToFile('./baileys_store.json'), 10_000)
store.bind(sock.ev)

// Load message
const msg = await store.loadMessage(jid, messageId)

// List all chats
const chats = store.chats.all()
console.log('Chats:', chats.length)

// Group metadata cache
const NodeCache = require('@cacheable/node-cache')
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })
const sock = makeWASocket({
    cachedGroupMetadata: async (jid) => groupCache.get(jid)
})
```

### 16. Event System

```javascript
// Connection events
sock.ev.on('connection.update', ({ connection, lastDisconnect, qr, isOnline }) => {
    console.log('Connection:', connection, '| Online:', isOnline)
})

// Credential updates (always save)
sock.ev.on('creds.update', saveCreds)

// Incoming messages
sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type === 'notify') {
        for (const msg of messages) {
            console.log('New message from', msg.key.remoteJid)
        }
    }
})

// Message status updates
sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
        if (update.status) console.log('Message status:', update.status)
    }
})

// Message deletions
sock.ev.on('messages.delete', (item) => {
    console.log('Messages deleted:', item)
})

// Reactions
sock.ev.on('message.reaction', ({ key, reaction }) => {
    console.log(`Reaction ${reaction.text} on`, key.id)
})

// Chat events
sock.ev.on('chats.upsert', (chats) => {
    console.log('Chat upsert:', chats.length, 'chats')
})
sock.ev.on('chats.update', (updates) => {
    console.log('Chat updates:', updates)
})
sock.ev.on('chats.delete', (ids) => {
    console.log('Chats deleted:', ids)
})

// Group events
sock.ev.on('groups.update', (updates) => {
    for (const update of updates) {
        console.log('Group updated:', update.id, update.subject)
    }
})
sock.ev.on('group-participants.update', ({ id, participants, action }) => {
    console.log(`${action} in ${id}:`, participants)
})

// Contact events
sock.ev.on('contacts.upsert', (contacts) => {
    for (const c of contacts) {
        console.log('Contact:', c.id, c.notify)
    }
})

// Presence events
sock.ev.on('presence.update', ({ id, presences }) => {
    for (const [participant, presence] of Object.entries(presences)) {
        console.log(participant, 'is', presence.lastKnownPresence)
    }
})

// Calls
sock.ev.on('call', (calls) => {
    for (const call of calls) {
        console.log('Call from', call.from, 'status:', call.status)
    }
})
```

### 17. Configuration Options

```javascript
const sock = makeWASocket({
    // Required
    auth: state,

    // QR vs Pairing
    printQRInTerminal: true,

    // Browser fingerprint
    browser: Browsers.ubuntu('MyBot'),      // or Browsers.macOS('Desktop')

    // History sync
    syncFullHistory: false,

    // Presence
    markOnlineOnConnect: true,

    // Custom message ID generator
    generateMessageID: () => require('crypto').randomBytes(16).toString('hex').toUpperCase(),

    // Group metadata cache (recommended)
    cachedGroupMetadata: async (jid) => groupCache.get(jid),

    // Message lookup (for retries and poll decryption)
    getMessage: async (key) => {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg?.message
    },

    // Link preview settings
    linkPreviewImageThumbnailWidth: 192,
    generateHighQualityLinkPreview: true,

    // Performance
    enableRecentMessageCache: true,
    maxMsgRetryCount: 5,

    // Custom logger
    logger: require('pino')({ level: 'silent' })
})
```

### 18. Utilities & Helpers

```javascript
const {
    getContentType,
    downloadMediaMessage,
    generateMessageID,
    normalizeMessageContent,
    extractMessageContent,
    jidDecode,
    jidNormalizedUser,
    jidEncode,
    isJidGroup,
    isJidNewsletter,
    isJidUser,
    areJidsSameUser,
    getAggregateVotesInPollMessage
} = require('@yemo-dev/yebail')

// Identify message type
const type = getContentType(msg.message)  // 'conversation' | 'imageMessage' | etc.

// Download media
const buffer = await downloadMediaMessage(msg, 'buffer', {})
const stream = await downloadMediaMessage(msg, 'stream', {})

// Generate unique ID
const id = generateMessageID()

// Normalize (unwrap deviceSentMessage etc.)
const content = normalizeMessageContent(msg.message)

// JID utilities
const { user, server, device } = jidDecode('628xxx@s.whatsapp.net')
const normalized = jidNormalizedUser('628xxx:10@s.whatsapp.net') // '628xxx@s.whatsapp.net'
const jid = jidEncode('628xxx', 's.whatsapp.net')
console.log(isJidGroup('xxx@g.us'))       // true
console.log(isJidNewsletter('xxx@newsletter')) // true
console.log(areJidsSameUser('628xxx@s.whatsapp.net', '628xxx:5@s.whatsapp.net')) // true

// Aggregate poll votes
const votes = getAggregateVotesInPollMessage({
    message: pollMsg.message,
    pollUpdates: update.pollUpdates
})
```

### 19. Message Options Reference

```javascript
// Send with expiry (ephemeral)
await sock.sendMessage(jid, { text: 'Disappears in 7 days' }, { ephemeralExpiration: 604800 })

// Send to broadcast (status/story)
await sock.sendMessage('status@broadcast', {
    text: '🌟 My story update',
    backgroundColor: '#FF5733',
    font: 3
}, {
    statusJidList: ['628xxx@s.whatsapp.net', '628yyy@s.whatsapp.net']
})

// Quoted reply
await sock.sendMessage(jid, { text: 'Reply text' }, { quoted: originalMsg })

// Mentions in group
await sock.sendMessage(groupJid, {
    text: '@628xxx you are mentioned!',
    mentions: ['628xxx@s.whatsapp.net']
})

// View-once media
await sock.sendMessage(jid, {
    image: fs.readFileSync('./secret.jpg'),
    viewOnce: true
})

// Forward with forwarded tag
await sock.sendMessage(jid, { forward: msg, force: true })
```

### 20. Privacy Settings Full Reference

```javascript
// Last seen: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateLastSeenPrivacy('contacts')

// Online: 'all' | 'match_last_seen'
await sock.updateOnlinePrivacy('match_last_seen')

// Profile picture: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateProfilePicturePrivacy('contacts')

// Status/Story: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateStatusPrivacy('contacts')

// Read receipts: 'all' | 'none'
await sock.updateReadReceiptsPrivacy('all')

// Group add: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateGroupsAddPrivacy('contacts')

// Messages: 'all' | 'contacts'
await sock.updateMessagesPrivacy('all')

// Calls: 'all' | 'contacts' | 'contact_blacklist' | 'none'
await sock.updateCallPrivacy('contacts')

// Default disappearing mode (seconds): 0=off, 86400=1d, 604800=7d, 7776000=90d
await sock.updateDefaultDisappearingMode(604800)

// Disable link previews in chats
await sock.updateDisableLinkPreviewsPrivacy(true)

// Block management
const list = await sock.fetchBlocklist()
await sock.updateBlockStatus('628xxx@s.whatsapp.net', 'block')
await sock.updateBlockStatus('628xxx@s.whatsapp.net', 'unblock')
```

</details>

<details>
<summary><strong>🧪 Full EXAMPLES Documentation (click to open)</strong></summary>

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

</details>
