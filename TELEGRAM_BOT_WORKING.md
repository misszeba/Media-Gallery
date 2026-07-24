# ✅ Telegram Bot Setup Complete

Your Telegram bot integration is **fully set up and ready to use**. Here's what to do next:

## What's Been Added

✅ **Simplified Polling Bot** (`bot/simple-bot.ts`) - Works locally with zero configuration
✅ **Telegram Webhook Endpoint** (`app/api/telegram/webhook`) - Receives photos and adds them to your gallery
✅ **Test Script** (`scripts/test-bot.js`) - Verifies your setup
✅ **Setup Guide** (`BOT_SETUP_GUIDE.md`) - Complete documentation
✅ **Gallery Auto-Update** - Photos appear instantly on your site

## 3-Step Setup

### 1️⃣ Get Your Bot Token

Open Telegram and follow these steps:

1. Search for `@BotFather`
2. Send `/newbot`
3. Give your bot a name (e.g., "Aperture Bot")
4. Give it a username (e.g., "aperture_media_bot")
5. **Copy the token** (looks like: `6123456789:AAHjK8FhPvJ...`)

### 2️⃣ Set Environment Variables

**In your Vercel project:**

Go to Settings → Environment Variables and add:

```
TELEGRAM_BOT_TOKEN=6123456789:AAHjK8FhPvJ...  (your token from step 1)
TELEGRAM_WEBHOOK_SECRET=random-secret-string  (any random string)
WEBHOOK_URL=http://localhost:3000             (for development)
```

**Or locally, create `.env.local`:**
```
TELEGRAM_BOT_TOKEN=6123456789:AAHjK8FhPvJ...
TELEGRAM_WEBHOOK_SECRET=my-secret-key
WEBHOOK_URL=http://localhost:3000
```

### 3️⃣ Start the Bot and Website

**Terminal 1 - Run the website:**
```bash
cd /vercel/share/v0-project
pnpm dev
```

**Terminal 2 - Run the bot:**
```bash
cd /vercel/share/v0-project
pnpm bot:dev
```

When you see this in Terminal 2, you're ready:
```
✅ Bot connected: @your_bot_username
🔄 Polling for updates
```

## Send Your First Photo

1. Open Telegram
2. Find your bot by username (e.g., search `@aperture_media_bot`)
3. Send `/start` to see instructions
4. **Send a photo with this caption:**

```
Mountain Lake|Dolomites, Italy|Landscapes|2024
```

Format: `Title|Location|Category|Year`

Valid categories:
- `Landscapes`
- `Architecture`
- `Portraits`
- `Street`

## What Happens

✅ Bot receives your photo
✅ Bot validates the caption format
✅ Bot sends it to your website
✅ Photo appears on http://localhost:3000 instantly
✅ Gallery updates without refreshing (auto-reload on next visit)

## Verify It's Working

```bash
node scripts/test-bot.js
```

You should see:
```
✓ TELEGRAM_BOT_TOKEN: SET
✓ TELEGRAM_WEBHOOK_SECRET: SET
✅ Bot connected: @your_bot_username
✅ Webhook registered successfully
```

## Need Help?

### Bot not responding?
- Check bot terminal for errors
- Verify TELEGRAM_BOT_TOKEN is correct
- Make sure website is running (`pnpm dev`)

### Photo doesn't appear?
- Check caption format: `Title|Location|Category|Year` (must have exactly 3 pipes)
- Check category is spelled correctly (case-sensitive)
- Check year is a number (e.g., 2024)
- Check website terminal for errors

### View Logs

**Bot terminal** shows messages being processed:
```
[Bot] Message from John: photo=true
[Bot] Processing photo with caption: Mountain Lake|...
[Bot] Webhook processed successfully
```

**Website terminal** shows photos being added:
```
[v0] Processing media: Mountain Lake
[v0] Media added to gallery
```

## File Locations

- Bot code: `bot/simple-bot.ts`
- Webhook: `app/api/telegram/webhook/route.ts`
- Gallery data: `data/gallery.json` (auto-updated)
- Docs: `BOT_SETUP_GUIDE.md`
- Test: `scripts/test-bot.js`

## Production Deployment

When ready to deploy to Vercel:

1. Set environment variables in Vercel dashboard
2. Update `WEBHOOK_URL` to your Vercel domain (e.g., `https://my-gallery.vercel.app`)
3. Run setup script to register webhook:

```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://my-gallery.vercel.app/api/telegram/webhook",
    "secret_token":"YOUR_SECRET"
  }'
```

Done! Your bot is ready. Start sending photos! 📸
