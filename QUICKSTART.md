# Aperture Gallery + Telegram Bot - Quick Start

Get your Telegram-powered photo gallery running in 5 minutes.

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow prompts to name and create your bot
4. **Copy the bot token** (e.g., `123456:ABC-DEF...`)

## Step 2: Set Environment Variables

Create `.env.local` in the project root:

```bash
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_WEBHOOK_SECRET=your_secret_here
WEBHOOK_URL=http://localhost:3000
BOT_MODE=polling
```

Generate a random secret:
```bash
openssl rand -base64 32
```

## Step 3: Install & Run

```bash
# Install dependencies
pnpm install

# Terminal 1: Start the Next.js app
pnpm dev

# Terminal 2: Start the bot
pnpm bot:dev
```

The app runs at `http://localhost:3000` and the bot starts polling for messages.

## Step 4: Send Your First Photo

1. Open Telegram and search for your bot name
2. Send `/start` to see the welcome message
3. Send a photo with caption in this format:

```
Title|Location|Category|Year
```

**Example:**
```
Mountain Lake|Dolomites, Italy|Landscapes|2024
```

Valid categories: `Landscapes`, `Architecture`, `Portraits`, `Street`

## Step 5: Check Your Gallery

Open `http://localhost:3000` and your photo should appear instantly!

## Common Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome & instructions |
| `/help` | Format help & troubleshooting |

## Deploy to Production

1. Push code to GitHub
2. Deploy to Vercel via GitHub integration
3. Add environment variables in Vercel dashboard:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `WEBHOOK_URL` = your Vercel URL
   - `BOT_MODE` = `webhook`

4. Register webhook:
```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://your-site.vercel.app/api/telegram/webhook",
    "secret_token":"YOUR_SECRET"
  }'
```

## File Structure

```
.
├── app/
│   ├── page.tsx              # Gallery UI
│   ├── api/
│   │   └── telegram/
│   │       └── webhook/
│   │           └── route.ts  # Webhook endpoint
│   └── ...
├── bot/
│   └── telegram-bot.ts       # Bot server
├── components/
│   ├── media-gallery.tsx     # Main gallery
│   ├── media-list.tsx        # List view
│   └── ...
├── data/
│   └── gallery.json          # Media storage (updated by bot)
├── lib/
│   ├── gallery-data.ts       # Data loader
│   └── telegram.ts           # Telegram utilities
├── BOT_README.md             # Detailed bot docs
├── TELEGRAM_SETUP.md         # Setup guide
└── .env.example              # Environment template
```

## Troubleshooting

**Bot not responding?**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check that `pnpm bot:dev` is running
- Try `/start` command

**Photo not appearing?**
- Check caption format: `Title|Location|Category|Year`
- Verify category is one of: Landscapes, Architecture, Portraits, Street
- Verify Year is a 4-digit number

**Invalid format error?**
- Use pipes `|` not commas
- Include all 4 fields
- No extra spaces needed (they're trimmed)

## What's Included

✅ **Gallery App** - Beautiful photo gallery with grid/list views
✅ **Telegram Bot** - Easy photo upload with metadata
✅ **Webhook Endpoint** - Processes incoming photos
✅ **Media Proxy** - Serves photos from Telegram CDN
✅ **JSON Storage** - Simple file-based database
✅ **Polling Mode** - Works on localhost (development)
✅ **Webhook Mode** - For production deployment

## Next Steps

- Read `BOT_README.md` for detailed bot documentation
- Read `TELEGRAM_SETUP.md` for production setup
- Customize gallery styling in `app/globals.css`
- Modify bot messages in `bot/telegram-bot.ts`

Happy uploading! 📸
