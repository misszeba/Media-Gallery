# Telegram Bot Setup Guide

This guide explains how to set up the Telegram bot for the media gallery.

## Prerequisites

- A Telegram account
- A Vercel deployment (or local URL using ngrok for development)
- Node.js environment

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/start` and then `/newbot`
3. Follow the prompts:
   - Choose a name for your bot (e.g., "Aperture Media Bot")
   - Choose a username (must end with "bot", e.g., "aperture_media_bot")
4. You'll receive a **Bot Token** - save this

Example token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

## Step 2: Configure Environment Variables

Add these to your Vercel environment variables:

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=your-random-secret-string-here
```

Generate a secure webhook secret:
```bash
openssl rand -hex 32
```

## Step 3: Deploy Your App

Make sure your app is deployed to Vercel so it has a public URL:
```
https://your-project-name.vercel.app
```

## Step 4: Register the Webhook

Once deployed, register your bot's webhook with Telegram.

Send a request to set the webhook:

```bash
curl -X POST https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project-name.vercel.app/api/telegram/webhook",
    "secret_token": "your-random-secret-string"
  }'
```

You should get a response like:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## Step 5: Send Media to Your Bot

Open your bot in Telegram and send a photo with a caption in this format:

```
Title|Location|Category|Year
```

### Example Captions:

- `Morning Lake|Swiss Alps|Landscapes|2024`
- `Glass Tower|Downtown NYC|Architecture|2024`
- `Studio Portrait|Studio No. 4|Portraits|2024`
- `Market Street|Tokyo, Japan|Street|2024`

### Requirements:

- **Title**: Name of the photo
- **Location**: Where it was taken
- **Category**: One of: `Landscapes`, `Architecture`, `Portraits`, `Street`
- **Year**: Year as number (e.g., 2024)

The media will automatically appear on your gallery website!

## Step 6: Verify Setup

To check if your webhook is working:

```bash
curl https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project-name.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

## Troubleshooting

### Media not appearing?

1. Check Vercel logs: `vercel logs`
2. Check caption format (must be `Title|Location|Category|Year`)
3. Ensure category is exactly one of: Landscapes, Architecture, Portraits, Street
4. Check that `TELEGRAM_BOT_TOKEN` is set in Vercel

### Webhook not registered?

- Make sure your Vercel URL is public and HTTPS
- Try setting webhook again (Step 4)
- Check bot token is correct

### Photos not loading on site?

- The proxy endpoint `/api/media/[fileId]` fetches from Telegram on-demand
- Check browser console for errors
- Verify bot token is set

## How It Works

1. You send a photo to the bot with metadata in the caption
2. The webhook receives the update at `/api/telegram/webhook`
3. The metadata is parsed from the caption
4. A new entry is added to `gallery.json` with the Telegram file ID
5. When you view the gallery, photos are fetched from Telegram via `/api/media/[fileId]`
6. The proxy endpoint caches files for 24 hours

## Important: Only Telegram Media Shows

**The gallery starts empty.** Only media you send to the Telegram bot will appear on your site.

- Gallery data is in `data/gallery.json`
- It starts with zero media items (empty array)
- Each photo sent to the bot adds one entry to this file
- If you delete an entry from `gallery.json`, it disappears from the site
- There is no UI for managing media—only add/remove via Telegram or by editing JSON directly

## File Storage

Media files are stored in Telegram's CDN, not on your server. This means:
- ✅ Unlimited free storage
- ✅ CDN delivery
- ✅ Only media you send appears on site
- ❌ Depends on Telegram's availability
- ❌ Files deleted if Telegram account is closed

For production, consider using Vercel Blob instead (modify the webhook to upload files).
