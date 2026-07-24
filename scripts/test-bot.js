#!/usr/bin/env node

/**
 * Test script to verify Telegram bot configuration and webhook
 * Usage: node scripts/test-bot.js
 */

const botToken = process.env.TELEGRAM_BOT_TOKEN
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
const webhookUrl = process.env.WEBHOOK_URL

console.log("🤖 Telegram Bot Configuration Test\n")
console.log("Checking environment variables...")
console.log(
  `✓ TELEGRAM_BOT_TOKEN: ${botToken ? "SET" : "❌ MISSING"} (${botToken ? botToken.substring(0, 10) + "..." : ""})`
)
console.log(
  `✓ TELEGRAM_WEBHOOK_SECRET: ${webhookSecret ? "SET" : "❌ MISSING"}`
)
console.log(`✓ WEBHOOK_URL: ${webhookUrl || "http://localhost:3000"}`)

if (!botToken) {
  console.error(
    "\n❌ TELEGRAM_BOT_TOKEN is required. Get it from @BotFather on Telegram."
  )
  process.exit(1)
}

async function testBotConnection() {
  console.log("\n📡 Testing bot connection...")
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const data = await response.json()

    if (data.ok) {
      console.log(`✅ Bot connected: @${data.result.username}`)
      console.log(`   Name: ${data.result.first_name}`)
      console.log(`   ID: ${data.result.id}`)
      return true
    } else {
      console.error(
        `❌ Bot connection failed: ${data.description || "Unknown error"}`
      )
      return false
    }
  } catch (error) {
    console.error(`❌ Connection error: ${error}`)
    return false
  }
}

async function testWebhookSetup() {
  console.log("\n🔗 Testing webhook setup...")
  const fullWebhookUrl = `${webhookUrl}/api/telegram/webhook`
  const secret = webhookSecret || "dev-secret"

  console.log(`Webhook URL: ${fullWebhookUrl}`)
  console.log(`Webhook Secret: ${secret}`)

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: fullWebhookUrl,
          secret_token: secret,
        }),
      }
    )

    const data = await response.json()

    if (data.ok) {
      console.log(`✅ Webhook registered successfully`)
      console.log(`   Description: ${data.description}`)
    } else {
      console.error(`❌ Webhook setup failed: ${data.description}`)
    }
  } catch (error) {
    console.error(`❌ Webhook setup error: ${error}`)
  }
}

async function showInstructions() {
  console.log("\n📋 Next Steps:")
  console.log(`1. Open Telegram and find your bot: search for @${botToken.split(":")[0]}`)
  console.log(`2. Send /start to the bot`)
  console.log(`3. Send a photo with caption: Mountain Lake|Dolomites, Italy|Landscapes|2024`)
  console.log(`4. Check the gallery at http://localhost:3000`)
  console.log(
    "\n💡 For polling mode (development), run: pnpm bot:dev in a separate terminal"
  )
  console.log("💡 For webhook mode (production), ensure your WEBHOOK_URL is publicly accessible")
}

async function main() {
  const botConnected = await testBotConnection()
  if (botConnected) {
    await testWebhookSetup()
  }
  await showInstructions()
}

main()
