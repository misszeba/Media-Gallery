# Telegram Media Gallery Integration - Summary

Your media gallery now supports **automatic media uploads via Telegram bot**. Here's everything you need to know.

## What Was Built

### 1. **Telegram Webhook Endpoint** (`/api/telegram/webhook`)
   - Receives media updates from your Telegram bot
   - Parses metadata from photo captions
   - Automatically adds new media to `gallery.json`
   - Runs on webhook mode (recommended for production)

### 2. **Media Proxy Endpoint** (`/api/media/[fileId]`)
   - Serves images from Telegram's CDN
   - Handles file retrieval and caching (24h TTL)
   - No local storage needed - files stay in Telegram

### 3. **Telegram Utilities** (`/lib/telegram.ts`)
   - File path resolution from Telegram API
   - Metadata parsing from caption format
   - Webhook signature verification
   - Type-safe TypeScript interfaces

### 4. **Setup Tools**
   - `TELEGRAM_SETUP.md` - Detailed setup guide
   - `setup-telegram.js` - Automated webhook registration script
   - `.env.example` - Environment variables template

## Quick Start

### Step 1: Set Environment Variables
```bash
# Add to Vercel project settings or .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 2: Create Telegram Bot
1. Open Telegram, search for `@BotFather`
2. Send `/newbot` and follow prompts
3. Copy the **Bot Token** and save to environment variables

### Step 3: Deploy to Vercel
Push your code to deploy the webhook endpoint.

### Step 4: Register Webhook
```bash
node scripts/setup-telegram.js "YOUR_BOT_TOKEN" "https://your-site.vercel.app" "YOUR_SECRET"
```

### Step 5: Send Media
Open your bot in Telegram and send a photo with caption:
```
Title|Location|Category|Year
```

**Examples:**
- `Mountain Lake|Dolomites, Italy|Landscapes|2024`
- `Glass Tower|NYC Downtown|Architecture|2024`
- `Portrait Study|Studio 4|Portraits|2024`
- `Market Street|Tokyo|Street|2024`

The photo will **automatically appear** on your gallery in seconds!

## How It Works

```
You send photo to Telegram Bot
         ↓
Telegram sends webhook to /api/telegram/webhook
         ↓
Webhook parses caption (Title|Location|Category|Year)
         ↓
Validates metadata and Telegram file ID
         ↓
Adds entry to gallery.json with Telegram file ID
         ↓
Gallery component reads updated gallery.json
         ↓
Image served via /api/media/[fileId] proxy
         ↓
Photo appears on your site instantly
```

## Features

- ✅ **Auto-publish** - Media appears immediately (no approval needed)
- ✅ **Webhook mode** - Production-ready, not polling
- ✅ **Telegram CDN** - Files hosted by Telegram, no storage costs
- ✅ **Metadata parsing** - Caption-based title, location, category, year
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Caching** - 24-hour cache on served media
- ✅ **JSON-based** - No database needed

## File Structure

```
/vercel/share/v0-project/
├── app/
│   └── api/
│       ├── telegram/webhook/route.ts      # Receives media from bot
│       └── media/[fileId]/route.ts        # Serves files from Telegram
├── lib/
│   └── telegram.ts                         # Utilities & types
├── data/
│   └── gallery.json                        # Media metadata (auto-updated)
├── scripts/
│   └── setup-telegram.js                   # Webhook registration
├── TELEGRAM_SETUP.md                       # Detailed setup guide
└── .env.example                            # Environment template
```

## Caption Format

**Format:** `Title|Location|Category|Year`

- **Title**: Photo name (any text, max ~100 chars)
- **Location**: Where photo was taken (any text)
- **Category**: Must be one of:
  - `Landscapes`
  - `Architecture`
  - `Portraits`
  - `Street`
- **Year**: Year as 4-digit number (e.g., 2024)

**Example:** `Alpine Morning|Banff National Park|Landscapes|2024`

## Media Item Schema

New media items have this structure in `gallery.json`:

```json
{
  "id": "telegram-abc123...",
  "title": "Alpine Morning",
  "location": "Banff National Park",
  "year": 2024,
  "category": "Landscapes",
  "type": "photo",
  "src": "/api/media/AgADAgADr6cxGy...",
  "ratio": 0.75,
  "telegramFileId": "AgADAgADr6cxGy...",
  "telegramFilePath": "photos/file_123.jpg"
}
```

## Troubleshooting

### Media not appearing?
1. Check caption format (must be `Title|Location|Category|Year`)
2. Verify category is exactly: Landscapes, Architecture, Portraits, or Street
3. Check Vercel logs: `vercel logs`
4. Ensure environment variables are set in Vercel

### Webhook not working?
1. Verify deployment is public and HTTPS
2. Check bot token is correct
3. Re-run setup script (Step 4)
4. Check `getWebhookInfo`: 
   ```bash
   curl https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
   ```

### Photos not loading?
1. Check browser console for errors
2. Verify Telegram bot still has access to photo file
3. Check `/api/media/[fileId]` is being called

## Limits & Considerations

- **Telegram API limits**: ~30 messages/second per bot
- **File size**: Telegram supports up to 10MB photos
- **Persistence**: Files only exist while Telegram has them
- **Metadata**: Limited to caption (max ~1024 chars)

## Next Steps

1. **Set up the bot** - Follow TELEGRAM_SETUP.md
2. **Send a test photo** - Verify it appears on gallery
3. **Share your bot** - Add to team or friends
4. **Customize** - Edit categories in `data/gallery.json`

## Support

- **Setup help**: See TELEGRAM_SETUP.md
- **API issues**: Check Vercel logs
- **Telegram bot questions**: Visit https://core.telegram.org/bots

---

Your media gallery is now ready for automatic updates via Telegram!
