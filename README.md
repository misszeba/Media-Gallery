# Aperture — Telegram-Powered Photo Gallery

A beautiful, modern photo gallery that auto-populates from a Telegram bot. Send photos to your bot, and they instantly appear on your gallery website.

## Features

✨ **Beautiful UI**
- Responsive grid and list views with masonry layout
- Smooth animations and hover effects
- Dark/light mode support
- #E8A698 salmon/coral accent color

🤖 **Telegram Integration**
- Send photos to a bot with metadata
- Auto-publish to your gallery
- Polling mode (development) & webhook mode (production)
- No database required

📱 **Gallery Features**
- Category filtering (Landscapes, Architecture, Portraits, Street)
- Full-screen lightbox viewer
- Keyboard navigation
- Item counter
- View toggle (grid/list)

🚀 **Easy Setup**
- Works on localhost (polling mode)
- Deploys to Vercel with one click
- All data stored in a JSON file
- No server costs (Telegram CDN storage)

## Quick Start

See `QUICKSTART.md` for a 5-minute setup guide.

## Documentation

- **`QUICKSTART.md`** — Get running in 5 minutes
- **`BOT_README.md`** — Detailed bot documentation
- **`TELEGRAM_SETUP.md`** — Production deployment guide
- **`INTEGRATION_SUMMARY.md`** — Technical architecture

## Project Structure

```
.
├── app/                          # Next.js app
│   ├── page.tsx                  # Gallery page
│   ├── api/
│   │   ├── telegram/webhook/     # Webhook endpoint
│   │   └── media/[fileId]/       # Photo proxy
│   └── globals.css               # Theme & styles
│
├── bot/                          # Telegram bot
│   └── telegram-bot.ts           # Bot server (polling/webhook)
│
├── components/                   # React components
│   ├── media-gallery.tsx         # Main gallery
│   ├── gallery-tile.tsx          # Grid tile
│   ├── media-list.tsx            # List view
│   └── lightbox.tsx              # Full-screen viewer
│
├── data/
│   └── gallery.json              # Gallery storage (updated by bot)
│
├── lib/
│   ├── gallery-data.ts           # Data loader
│   └── telegram.ts               # Telegram utilities
│
├── scripts/
│   └── setup-telegram.js         # Webhook setup helper
│
└── public/gallery/               # Generated image assets

```

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Bot:** TypeScript with Telegram Bot API
- **Storage:** JSON file (on Vercel) + Telegram CDN
- **UI Components:** shadcn/ui, Lucide icons

## Environment Variables

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token         # From @BotFather
TELEGRAM_WEBHOOK_SECRET=random_secret     # Generated secret

# Optional
WEBHOOK_URL=http://localhost:3000         # Default for dev
BOT_MODE=polling                          # polling or webhook
```

## Running Locally

```bash
# Install
pnpm install

# Terminal 1: Start app
pnpm dev

# Terminal 2: Start bot (polling mode)
pnpm bot:dev

# Open browser
open http://localhost:3000
```

## Sending Photos

Send a Telegram message to your bot with:
- A photo attachment
- Caption in format: `Title|Location|Category|Year`

Example: `Mountain Lake|Dolomites, Italy|Landscapes|2024`

Valid categories: `Landscapes`, `Architecture`, `Portraits`, `Street`

## Deployment

Deploy to Vercel with GitHub:
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Register webhook via curl command (see TELEGRAM_SETUP.md)

## Commands

**Gallery:**
- `pnpm dev` — Start Next.js dev server
- `pnpm build` — Build for production
- `pnpm start` — Start production server

**Bot:**
- `pnpm bot:dev` — Start bot (polling mode)
- `pnpm bot` — Start bot (webhook mode)

**Code Quality:**
- `pnpm lint` — Run ESLint
- `pnpm format` — Format with Prettier
- `pnpm typecheck` — TypeScript type check

## API Endpoints

### `/api/telegram/webhook` (POST)
Receives photos from the Telegram bot. Validates webhook secret and adds to gallery.json.

### `/api/media/[fileId]` (GET)
Proxy endpoint that fetches photos from Telegram CDN with 24-hour caching.

## How It Works

1. You send a photo to your Telegram bot
2. Bot receives the message and validates caption format
3. Bot sends photo details to webhook: `/api/telegram/webhook`
4. Webhook parses metadata and adds entry to `gallery.json`
5. Gallery component reloads and displays new photo
6. When photo is viewed, it's fetched from Telegram via `/api/media/[fileId]`

## File Storage

- **Telegram CDN:** Photos stored by Telegram (free, unlimited)
- **gallery.json:** Metadata stored locally (file-based, on Vercel filesystem)
- **No external database:** JSON file is the entire backend

## Troubleshooting

**Bot doesn't respond?**
- Check `TELEGRAM_BOT_TOKEN` is set correctly
- Verify bot is running: `pnpm bot:dev`

**Photo doesn't appear?**
- Check caption format: must be `Title|Location|Category|Year`
- Verify category is one of 4 valid options
- Year must be a 4-digit number

**Webhook errors?**
- Verify `WEBHOOK_URL` is publicly accessible HTTPS
- Check webhook secret matches in both bot and Vercel

See `BOT_README.md` for detailed troubleshooting.

## Customization

**Theme Colors:** Edit `app/globals.css`
- Primary: Dark brown/charcoal
- Accent: #E8A698 (salmon/coral)
- Background: Off-white/dark gray

**Bot Messages:** Edit `bot/telegram-bot.ts`
- Modify response text in `sendMessage()` calls
- Add new commands in `handleText()`

**Gallery Layout:** Edit components
- `components/media-gallery.tsx` — Grid layout
- `components/media-list.tsx` — List layout
- `components/gallery-tile.tsx` — Tile styling

## License

MIT

## Support

For issues, see:
- `BOT_README.md` — Bot troubleshooting
- `QUICKSTART.md` — Setup help
- `TELEGRAM_SETUP.md` — Deployment guide

---

Built with ❤️ for photographers and visual creators.
