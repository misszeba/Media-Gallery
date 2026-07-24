# Aperture Telegram Bot

The bot processes photos sent to your Telegram account and automatically adds them to your Aperture gallery.

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the prompts to create a new bot
4. Copy your **Bot Token** (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Set Environment Variables

Add these to your `.env.local` file:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_random_secret_here
WEBHOOK_URL=http://localhost:3000
BOT_MODE=polling
```

Generate a random secret:
```bash
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Bot

**Development (Polling mode):**
```bash
pnpm bot:dev
```

This runs the bot in polling mode, which continuously checks for new messages. Perfect for local development.

**Production (Webhook mode):**
```bash
BOT_MODE=webhook WEBHOOK_URL=https://your-site.com pnpm bot
```

This requires a deployed Next.js app with the webhook endpoint running.

## How to Use

Once the bot is running:

1. **Find your bot on Telegram**
   - Search for your bot name (e.g., `@ApertureBot`)
   - Send `/start` to see the welcome message

2. **Send a photo with metadata**
   - Take or upload a photo
   - Add a caption in this format: `Title|Location|Category|Year`
   - Example: `Mountain Lake|Dolomites, Italy|Landscapes|2024`

3. **Valid Categories**
   - `Landscapes`
   - `Architecture`
   - `Portraits`
   - `Street`

4. **Photo appears instantly**
   - The bot confirms the photo was added
   - Check your gallery at `http://localhost:3000`

## Command Reference

- `/start` — Welcome message and how-to guide
- `/help` — Help and format information

## Caption Format

```
Title|Location|Category|Year
```

| Field    | Example            | Notes                                  |
|----------|-------------------|----------------------------------------|
| Title    | Mountain Lake     | Name of the photo                      |
| Location | Dolomites, Italy  | Where it was taken                     |
| Category | Landscapes        | Must be one of 4 valid categories      |
| Year     | 2024              | 4-digit year number                    |

## Examples

```
Mountain Lake|Dolomites, Italy|Landscapes|2024
Glass Tower|New York, USA|Architecture|2024
Weathered Face|Havana, Cuba|Portraits|2023
Market Motion|Marrakech, Morocco|Street|2023
```

## Bot Modes

### Polling Mode (Development)
- Continuously checks Telegram for new messages
- Works on `localhost` (no public URL needed)
- Better for development and testing
- Use: `pnpm bot:dev`

### Webhook Mode (Production)
- Telegram sends messages directly to your app
- Requires public HTTPS URL and deployed app
- More efficient and scalable
- Use: `BOT_MODE=webhook WEBHOOK_URL=https://your-site.com pnpm bot`

## File Storage

- Photos are stored in Telegram's CDN
- Your bot fetches them via the `/api/media/[fileId]` proxy endpoint
- No storage costs
- Results cached for 24 hours

## Troubleshooting

### Bot doesn't respond
- Verify `TELEGRAM_BOT_TOKEN` is set correctly
- Check that the bot is running: `pnpm bot:dev`
- Try sending `/start` to the bot

### Photo not appearing
- Check the caption format: `Title|Location|Category|Year`
- Verify all pipes (|) are present
- Category must be exactly one of: Landscapes, Architecture, Portraits, Street
- Year must be a 4-digit number

### "Invalid format" error
- Make sure you're using pipes (|) not commas
- Check for extra spaces (they're trimmed automatically)
- Verify all 4 fields are present

### Webhook errors
- Ensure `WEBHOOK_URL` is publicly accessible HTTPS
- Check that the Next.js app is deployed and running
- Verify `TELEGRAM_WEBHOOK_SECRET` matches in both bot and webhook

## File Structure

```
bot/
├── telegram-bot.ts       # Main bot code
├── ...
```

The bot is a TypeScript file that:
1. Connects to Telegram Bot API
2. Receives photos from your account
3. Parses caption metadata
4. Sends to the Next.js webhook
5. Handles user interactions

## Environment Variables Reference

| Variable                | Required | Example                              | Notes                           |
|------------------------|----------|--------------------------------------|---------------------------------|
| TELEGRAM_BOT_TOKEN     | ✅       | `123456:ABC...`                      | From BotFather                  |
| TELEGRAM_WEBHOOK_SECRET| ✅       | Random 32-char string                | Use `openssl rand -base64 32`   |
| WEBHOOK_URL            | ✅       | `http://localhost:3000`              | Where bot sends photos          |
| BOT_MODE               | ✅       | `polling` or `webhook`               | Default: `polling`              |

## Running Both App and Bot

In development, run two terminal windows:

**Terminal 1 (Next.js app):**
```bash
pnpm dev
```

**Terminal 2 (Bot):**
```bash
pnpm bot:dev
```

Both will run on localhost and communicate via the webhook endpoint.

## Support

For issues:
1. Check the caption format
2. Verify all environment variables are set
3. Look for error messages from the bot
4. Check browser console for app errors
