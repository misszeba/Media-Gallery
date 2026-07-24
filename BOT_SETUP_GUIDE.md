# Telegram Bot Setup Guide

## Quick Start (5 minutes)

### Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the prompts:
   - Choose a name (e.g., "Aperture Gallery Bot")
   - Choose a username (e.g., "aperture_gallery_bot")
4. Copy the bot token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Step 2: Set Environment Variables

Add these to your `.env.local`:

```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_WEBHOOK_SECRET=your_random_secret_here
WEBHOOK_URL=http://localhost:3000
```

You can generate a random secret:
```bash
openssl rand -base64 32
```

### Step 3: Start the Bot and Website

**Terminal 1 - Start the Next.js website:**
```bash
pnpm dev
```

**Terminal 2 - Start the Telegram bot (polling mode):**
```bash
pnpm bot:dev
```

You should see:
```
🤖 Aperture Telegram Bot Starting...
✅ Bot connected: @your_bot_username
📡 Webhook URL: http://localhost:3000/api/telegram/webhook
🔄 Polling for updates (Ctrl+C to stop)
```

### Step 4: Send Your First Photo

1. Open Telegram and find your bot (search for the username you created)
2. Send `/start` to see instructions
3. Send a photo with caption in this format:

```
Title|Location|Category|Year
```

**Example captions:**
- `Mountain Lake|Dolomites, Italy|Landscapes|2024`
- `Glass Tower|New York|Architecture|2024`
- `Street Portrait|Tokyo|Street|2024`
- `Studio Lights|Studio 4|Portraits|2024`

**Valid Categories:**
- Landscapes
- Architecture
- Portraits
- Street

4. The bot will confirm with a checkmark
5. Your photo appears on http://localhost:3000

## Troubleshooting

### Bot not responding?

Check the bot terminal output for errors:
- `❌ Connection error` → Check your internet
- `❌ Failed to connect to bot` → Invalid TELEGRAM_BOT_TOKEN
- `⚠️ Webhook error` → The website isn't running

### Photo not appearing?

1. Check the bot terminal - it should show received messages
2. Check the console output of your website terminal
3. Verify caption format: `Title|Location|Category|Year` (must have 3 pipes)
4. Check that category is exactly: Landscapes, Architecture, Portraits, or Street

### How to debug?

Look at the logs:

**Bot terminal output:**
```
[Bot] Message from John: photo=true, text="null"
[Bot] Processing photo with caption: Mountain Lake|Dolomites, Italy|Landscapes|2024
[Bot] Webhook processed successfully
```

**Website terminal output:**
```
[v0] Telegram update received: 12345
[v0] Processing media: Mountain Lake
[v0] Media added to gallery: telegram-ABC123...
[v0] gallery.json updated
```

## Production Setup (Webhook Mode)

For production on Vercel, use webhook mode instead of polling:

1. Deploy your app to Vercel
2. Set environment variables on Vercel dashboard:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `WEBHOOK_URL=https://your-app.vercel.app`

3. Register the webhook:
```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://your-app.vercel.app/api/telegram/webhook",
    "secret_token":"YOUR_SECRET"
  }'
```

4. No need to run the bot script - Telegram will push updates directly to your webhook

## Common Issues

| Problem | Solution |
|---------|----------|
| Bot doesn't respond to /start | Check TELEGRAM_BOT_TOKEN is correct |
| Photo sent but doesn't appear | Check caption format (3 pipes required) |
| "Invalid category" error | Use exact names: Landscapes, Architecture, Portraits, Street |
| "Invalid year" error | Year must be a number like 2024 |
| Website doesn't update | Restart the website with `pnpm dev` |

## Testing

Run the test script to verify everything is configured:

```bash
node scripts/test-bot.js
```

This will check:
- Bot token is valid
- Bot can connect to Telegram
- Webhook is properly configured

## File Structure

```
bot/
  ├── simple-bot.ts          # Main polling bot (development)
  └── telegram-bot.ts        # Alternative bot (legacy)

app/api/telegram/
  └── webhook/
      └── route.ts           # Receives photos from bot

lib/telegram.ts              # Utilities for file handling

data/gallery.json            # Where media is stored (auto-updated)

scripts/
  └── test-bot.js            # Configuration test
```
