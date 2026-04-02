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
