#!/usr/bin/env node

/**
 * Setup script for Telegram bot webhook
 * Usage: node scripts/setup-telegram.js <bot_token> <webhook_url> <secret>
 * Example: node scripts/setup-telegram.js "123456:ABC..." "https://example.com" "my-secret"
 */

const https = require("https")
const url = require("url")

const args = process.argv.slice(2)

if (args.length < 3) {
  console.error(
    "Usage: node scripts/setup-telegram.js <bot_token> <webhook_url> <secret>"
  )
  console.error("")
  console.error(
    "Example: node scripts/setup-telegram.js '123456:ABC-DEF...' 'https://mysite.com' 'my-secret'"
  )
  process.exit(1)
}

const botToken = args[0]
const webhookUrl = args[1]
const secret = args[2]

const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`

const payload = JSON.stringify({
  url: webhookUrl + "/api/telegram/webhook",
  secret_token: secret,
})

console.log("Setting up Telegram webhook...")
console.log("Bot token:", botToken.substring(0, 10) + "...")
console.log("Webhook URL:", webhookUrl + "/api/telegram/webhook")
console.log("Secret token:", secret.substring(0, 10) + "...")
console.log("")

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
}

const req = https.request(apiUrl, options, (res) => {
  let data = ""

  res.on("data", (chunk) => {
    data += chunk
  })

  res.on("end", () => {
    const response = JSON.parse(data)

    if (response.ok) {
      console.log("✓ Webhook registered successfully!")
      console.log("")
      console.log("Next steps:")
      console.log(
        "1. Open Telegram and find your bot (@your_bot_username)"
      )
      console.log("2. Send a photo with caption: Title|Location|Category|Year")
      console.log("   Example: Mountain Lake|Dolomites|Landscapes|2024")
      console.log("3. The photo should appear on your gallery site")
      console.log("")
      console.log("To verify webhook is working:")
      console.log(
        `  curl https://api.telegram.org/bot${botToken.substring(0, 10)}...${botToken.substring(botToken.length - 10)}/getWebhookInfo`
      )
    } else {
      console.error("✗ Failed to register webhook")
      console.error("Error:", response.description || response)
      process.exit(1)
    }
  })
})

req.on("error", (e) => {
  console.error("✗ Request failed:", e.message)
  process.exit(1)
})

req.write(payload)
req.end()
