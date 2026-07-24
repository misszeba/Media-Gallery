import https from "https"

interface TelegramMessage {
  message_id: number
  from: { id: number; first_name: string }
  chat: { id: number }
  photo?: Array<{ file_id: string }>
  caption?: string
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000"
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "dev-secret"

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set")
  process.exit(1)
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`
let lastUpdateId = 0

async function request(method: string, params: Record<string, unknown> = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value)
          return acc
        },
        {} as Record<string, string>
      )
    ).toString()

    const url = `${API_URL}/${method}${queryString ? "?" + queryString : ""}`
    const options = { headers: { "Content-Type": "application/json" } }

    https
      .get(url, options, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error("Failed to parse response"))
          }
        })
      })
      .on("error", reject)
  })
}

async function postRequest(
  method: string,
  body: Record<string, unknown> = {}
) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }

    const req = https.request(
      `${API_URL}/${method}`,
      options,
      (res) => {
        let responseData = ""
        res.on("data", (chunk) => {
          responseData += chunk
        })
        res.on("end", () => {
          try {
            resolve(JSON.parse(responseData))
          } catch {
            reject(new Error("Failed to parse response"))
          }
        })
      }
    )

    req.on("error", reject)
    req.write(data)
    req.end()
  })
}

async function sendMessage(chatId: number, text: string) {
  console.log(`[Bot] Sending message to ${chatId}`)
  try {
    await postRequest("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    })
  } catch (error) {
    console.error("[Bot] Error sending message:", error)
  }
}

async function handleUpdate(update: TelegramUpdate) {
  if (!update.message) return

  const { message } = update
  const { chat, from, photo, caption, text } = message

  console.log(`[Bot] Message from ${from.first_name}: photo=${!!photo}, text="${text}"`)

  if (text === "/start" || text === "/help") {
    await sendMessage(
      chat.id,
      `👋 <b>Welcome to Aperture Bot!</b>\n\n📸 <b>How to use:</b>\n1. Send a photo\n2. Add a caption: <code>Title|Location|Category|Year</code>\n\n<b>Example:</b>\n<code>Mountain Lake|Dolomites, Italy|Landscapes|2024</code>\n\n<b>Valid Categories:</b>\n• Landscapes\n• Architecture\n• Portraits\n• Street`
    )
    return
  }

  if (photo && caption) {
    console.log(`[Bot] Processing photo with caption: ${caption}`)

    // Send to webhook
    try {
      const payload = {
        update_id: update.update_id,
        message: {
          message_id: message.message_id,
          from: { id: from.id, first_name: from.first_name },
          chat: { id: chat.id },
          photo,
          caption,
        },
      }

      const response = await postRequest(
        `${WEBHOOK_URL.replace("http://", "").replace("https://", "")}/api/telegram/webhook`.includes(
          "/"
        )
          ? WEBHOOK_URL + "/api/telegram/webhook"
          : "",
        payload
      )

      console.log("[Bot] Webhook response:", response)

      // Also try direct fetch for local development
      try {
        const fetchResponse = await fetch(`${WEBHOOK_URL}/api/telegram/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Bot-API-Secret-Token": WEBHOOK_SECRET,
          },
          body: JSON.stringify(payload),
        })

        if (fetchResponse.ok) {
          console.log("[Bot] Webhook processed successfully")
          await sendMessage(
            chat.id,
            `✅ <b>Photo Added!</b>\n\n<b>Title:</b> ${caption.split("|")[0] || "Unknown"}\n\nYour photo will appear on the gallery shortly!`
          )
        } else {
          console.error("[Bot] Webhook error:", fetchResponse.status)
          await sendMessage(
            chat.id,
            `⚠️ Photo received but processing failed. Please check the caption format.`
          )
        }
      } catch (fetchError) {
        console.error("[Bot] Fetch error:", fetchError)
        await sendMessage(chat.id, `❌ Connection error. Please try again later.`)
      }
    } catch (error) {
      console.error("[Bot] Error processing photo:", error)
      await sendMessage(chat.id, `❌ Error processing photo: ${error}`)
    }
    return
  }

  if (photo && !caption) {
    await sendMessage(
      chat.id,
      `❌ <b>Missing Caption</b>\n\nPlease send a photo with a caption:\n<code>Title|Location|Category|Year</code>\n\n<b>Example:</b>\n<code>Mountain Lake|Dolomites, Italy|Landscapes|2024</code>`
    )
    return
  }

  if (text) {
    await sendMessage(
      chat.id,
      `📸 Please send a photo with the caption in this format:\n<code>Title|Location|Category|Year</code>`
    )
  }
}

async function pollUpdates() {
  console.log("[Bot] Starting polling...")

  while (true) {
    try {
      const response = (await request("getUpdates", {
        offset: lastUpdateId + 1,
        timeout: 30,
      })) as { ok: boolean; result: TelegramUpdate[] }

      if (response.ok && response.result.length > 0) {
        console.log(
          `[Bot] Received ${response.result.length} update(s)`
        )
        for (const update of response.result) {
          lastUpdateId = update.update_id
          await handleUpdate(update)
        }
      }
    } catch (error) {
      console.error("[Bot] Polling error:", error)
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait before retrying
    }
  }
}

async function getMe() {
  try {
    const response = (await request("getMe")) as { ok: boolean; result: any }
    if (response.ok) {
      console.log(`✅ Bot connected: @${response.result.username}`)
      return true
    }
  } catch (error) {
    console.error("❌ Failed to connect to bot:", error)
    return false
  }
}

async function main() {
  console.log("🤖 Aperture Telegram Bot Starting...\n")

  const connected = await getMe()
  if (!connected) {
    console.error("\n❌ Cannot connect to Telegram. Check your TELEGRAM_BOT_TOKEN")
    process.exit(1)
  }

  console.log(`📡 Webhook URL: ${WEBHOOK_URL}/api/telegram/webhook`)
  console.log(`🔄 Polling for updates (Ctrl+C to stop)\n`)

  await pollUpdates()
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
