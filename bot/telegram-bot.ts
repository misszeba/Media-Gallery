import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import https from "https"
import http from "http"
import mongoose from "mongoose" // MongoDB কানেকশনের জন্য Mongoose যুক্ত করা হয়েছে

const envLocalPath = path.resolve(process.cwd(), ".env.local")
const envPath = path.resolve(process.cwd(), ".env")

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
  console.log("📁 [Env] Loaded environment variables from .env.local")
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log("📁 [Env] Loaded environment variables from .env")
} else {
  dotenv.config()
}

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: { id: number; first_name: string }
    chat: { id: number }
    photo?: Array<{ file_id: string; file_unique_id: string }>
    video?: { file_id: string }
    animation?: { file_id: string }
    document?: { file_id: string; mime_type?: string }
    caption?: string
    text?: string
  }
  callback_query?: {
    id: string
    from: { id: number; first_name: string }
    message?: { message_id: number; chat: { id: number } }
    data?: string
  }
}

interface TelegramResponse {
  ok: boolean
  result?: unknown
  error_code?: number
  description?: string
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000"
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "dev-secret"

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is not set")
  process.exit(1)
}

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

interface PendingMedia {
  message: any
  title: string
  location: string
  year: number
  updateId: number
  messageId: number
  from: { id: number; first_name: string }
}

const pendingMediaMap = new Map<string, PendingMedia>()
const userStates = new Map<number, { action: string; pendingId: string }>()

// ============================================================================
// MongoDB Setup & Schema Configuration for Bot
// ============================================================================
const CategorySchema = new mongoose.Schema({ name: String })
const MediaSchema = new mongoose.Schema({ category: String })

const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema)
const MediaModel = mongoose.models.Media || mongoose.model("Media", MediaSchema)

async function connectBotDB(): Promise<boolean> {
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI missing in environment variables!")
      return false
    }
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      return true
    } catch (e) {
      console.error("❌ Failed to connect to MongoDB:", e)
      return false
    }
  }
  return true
}

/**
 * ডাটাবেস থেকে ক্যাটাগরি লিস্ট পড়ে আনার ফাংশন
 */
async function getCategories(): Promise<string[]> {
  try {
    await connectBotDB()
    const cats = await CategoryModel.find().select("name -_id").lean()
    
    // ডাটাবেসে কোনো ক্যাটাগরি না থাকলে ডিফল্টগুলো তৈরি করে দেবে
    if (cats.length === 0) {
      const defaultCats = ["Landscapes", "Architecture", "Portraits", "Street"]
      for (const name of defaultCats) {
        await CategoryModel.findOneAndUpdate({ name }, { name }, { upsert: true })
      }
      return defaultCats
    }
    return cats.map((c: any) => c.name)
  } catch (e) {
    console.error("Error fetching categories from MongoDB:", e)
    return ["Landscapes", "Architecture", "Portraits", "Street"]
  }
}

/**
 * ডাটাবেস থেকে ক্যাটাগরি ডিলিট করা এবং ঐ ক্যাটাগরির মিডিয়াগুলোকে "All" এ পাঠানো
 */
async function deleteCategory(catToDelete: string): Promise<boolean> {
  try {
    await connectBotDB()
    await CategoryModel.deleteOne({ name: catToDelete })
    // ডিলিট করা ক্যাটাগরির মিডিয়াগুলোকে "All" ট্যাবে দেখানোর জন্য ক্যাটাগরি ফাঁকা করে দেওয়া হচ্ছে
    await MediaModel.updateMany({ category: catToDelete }, { $set: { category: "" } })
    return true
  } catch (e) {
    console.error("Error deleting category from MongoDB:", e)
    return false
  }
}

// ============================================================================
// Telegram Request & Helper Functions
// ============================================================================
async function makeRequest(
  url: string,
  method: string = "GET",
  body?: unknown
): Promise<TelegramResponse> {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    }

    const req = https.request(url, options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve({ ok: false, description: "Failed to parse response" })
        }
      })
    })

    req.on("error", reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown
): Promise<TelegramResponse> {
  return makeRequest(`${API_URL}/sendMessage`, "POST", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  })
}

async function sendCategoryButtons(chatId: number, pendingId: string, title: string): Promise<void> {
  const categories = await getCategories()
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = []

  for (let i = 0; i < categories.length; i += 2) {
    const row = []
    row.push({ text: `📁 ${categories[i]}`, callback_data: `cat:${categories[i]}:${pendingId}` })
    if (categories[i + 1]) {
      row.push({ text: `📁 ${categories[i + 1]}`, callback_data: `cat:${categories[i + 1]}:${pendingId}` })
    }
    keyboard.push(row)
  }

  keyboard.push([
    { text: "⏭️ Skip Category (Show in All)", callback_data: `skip:${pendingId}` },
    { text: "➕ New Category", callback_data: `new:${pendingId}` },
  ])
  
  if (categories.length > 0) {
    keyboard.push([{ text: "🗑️ Manage/Delete Categories", callback_data: `del_menu:${pendingId}` }])
  }

  await sendMessage(
    chatId,
    `🎬 <b>Media Received!</b>\n\n<b>Title:</b> ${title}\n\n🗂️ <b>Select a category for this media:</b>`,
    { inline_keyboard: keyboard }
  )
}

async function sendDeleteCategoryMenu(chatId: number, messageId?: number): Promise<void> {
  const categories = await getCategories()

  if (categories.length === 0) {
    await sendMessage(chatId, "ℹ️ No categories available to delete.")
    return
  }

  const keyboard = categories.map((cat) => [
    { text: `🗑️ Delete "${cat}"`, callback_data: `del_cat:${cat}` },
  ])
  keyboard.push([{ text: "❌ Close Menu", callback_data: "close_menu" }])

  const text = "🗑️ <b>Delete Category Menu:</b>\n\nSelect a category to delete. Media under this category will stay on the site and display directly under <b>'All'</b>."

  if (messageId) {
    await makeRequest(`${API_URL}/editMessageText`, "POST", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    })
  } else {
    await sendMessage(chatId, text, { inline_keyboard: keyboard })
  }
}

async function finalizeMediaUpload(
  pending: PendingMedia,
  category: string,
  chatId: number,
  buttonMessageId?: number
): Promise<void> {
  const caption = `${pending.title}|${pending.location}|${category}|${pending.year}`

  try {
    const webhookUrl = new URL(`${WEBHOOK_URL}/api/telegram/webhook`)
    const payload = {
      update_id: pending.updateId,
      message: {
        ...pending.message,
        caption,
      },
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-API-Secret-Token": WEBHOOK_SECRET,
      },
    }

    const requestModule = webhookUrl.protocol === "https:" ? https : http

    await new Promise<void>((resolve, reject) => {
      const req = requestModule.request(webhookUrl.toString(), options, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          if (res.statusCode === 200) resolve()
          else reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        })
      })
      req.on("error", reject)
      req.write(JSON.stringify(payload))
      req.end()
    })

    const displayCat = category ? `📁 ${category}` : "🌐 None (Visible in 'All' only)"
    const confirmationText = `✅ <b>Media Added Successfully!</b>\n\n<b>Title:</b> ${pending.title}\n<b>Category:</b> ${displayCat}\n<b>Location:</b> ${pending.location}\n<b>Year:</b> ${pending.year}\n\nYour media is now live on the gallery!`

    if (buttonMessageId) {
      await makeRequest(`${API_URL}/editMessageText`, "POST", {
        chat_id: chatId,
        message_id: buttonMessageId,
        text: confirmationText,
        parse_mode: "HTML",
      })
    } else {
      await sendMessage(chatId, confirmationText)
    }
  } catch (error) {
    console.error("Error sending to webhook:", error)
    await sendMessage(
      chatId,
      `❌ Failed to add media to gallery. Error: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

async function handleMedia(update: TelegramUpdate): Promise<void> {
  if (!update.message) return

  const { message } = update
  const { chat, from, caption } = message

  console.log(`🎬 [Bot] Media received from ${from.first_name}. Caption: ${caption || "No caption"}`)

  let title = "Untitled Media"
  let location = "Unknown Location"
  let year = new Date().getFullYear()

  if (caption && caption.trim()) {
    const parts = caption.split("|").map((p) => p.trim())
    if (parts.length >= 2) {
      title = parts[0] || "Untitled Media"
      location = parts[1] || "Unknown Location"
      if (parts[3]) year = parseInt(parts[3], 10) || year
    } else {
      title = caption.trim()
    }
  }

  const pendingId = Date.now().toString(36)
  pendingMediaMap.set(pendingId, {
    message,
    title,
    location,
    year,
    updateId: update.update_id,
    messageId: message.message_id,
    from,
  })

  await sendCategoryButtons(chat.id, pendingId, title)
}

async function handleCallbackQuery(callbackQuery: any): Promise<void> {
  const { id, message, data } = callbackQuery
  if (!data || !message) return

  await makeRequest(`${API_URL}/answerCallbackQuery`, "POST", { callback_query_id: id })

  if (data.startsWith("del_cat:")) {
    const catToDelete = data.replace("del_cat:", "")
    const success = await deleteCategory(catToDelete)
    if (success) {
      await makeRequest(`${API_URL}/editMessageText`, "POST", {
        chat_id: message.chat.id,
        message_id: message.message_id,
        text: `✅ Category <b>"${catToDelete}"</b> deleted successfully!\nAll media from this category will now appear directly under <b>'All'</b>.`,
        parse_mode: "HTML",
      })
    } else {
      await sendMessage(message.chat.id, "❌ Failed to delete category.")
    }
    return
  }

  if (data === "close_menu") {
    await makeRequest(`${API_URL}/deleteMessage`, "POST", {
      chat_id: message.chat.id,
      message_id: message.message_id,
    })
    return
  }

  const parts = data.split(":")
  const action = parts[0]
  const pendingId = parts[parts.length - 1]

  if (action === "del_menu") {
    await sendDeleteCategoryMenu(message.chat.id, message.message_id)
    return
  }

  const pending = pendingMediaMap.get(pendingId)
  if (!pending) {
    await sendMessage(message.chat.id, "❌ <b>Session Expired!</b> Please send the media again.")
    return
  }

  if (action === "cat") {
    const selectedCat = parts.slice(1, -1).join(":")
    await finalizeMediaUpload(pending, selectedCat, message.chat.id, message.message_id)
    pendingMediaMap.delete(pendingId)
  } else if (action === "skip") {
    await finalizeMediaUpload(pending, "", message.chat.id, message.message_id)
    pendingMediaMap.delete(pendingId)
  } else if (action === "new") {
    userStates.set(message.chat.id, { action: "waiting_new_category", pendingId })
    await sendMessage(
      message.chat.id,
      `➕ <b>Create New Category</b>\n\nPlease type and send the name for your new category:`
    )
  }
}

async function handleText(update: TelegramUpdate): Promise<void> {
  if (!update.message) return
  const { chat, text, from } = update.message
  if (!text) return

  console.log(`💬 [Bot] Text received from ${from.first_name}: "${text}"`)

  if (userStates.has(chat.id)) {
    const state = userStates.get(chat.id)!
    if (state.action === "waiting_new_category") {
      const newCategory = text.trim()
      const pending = pendingMediaMap.get(state.pendingId)

      if (pending) {
        await finalizeMediaUpload(pending, newCategory, chat.id)
        pendingMediaMap.delete(state.pendingId)
      } else {
        await sendMessage(chat.id, "❌ Session expired. Please send media again.")
      }
      userStates.delete(chat.id)
      return
    }
  }

  if (text.startsWith("/start")) {
    await sendMessage(
      chat.id,
      `👋 <b>Welcome to Aperture Bot!</b>\n\nI support Photos, Videos, GIFs, and Documents!\n\n📸 <b>How to use:</b>\n1. Simply send any media file.\n2. Choose a category, skip, or create a new one!\n\n<b>Management:</b>\nUse /categories to manage or delete existing categories.`
    )
  } else if (text.startsWith("/categories") || text.startsWith("/del_category")) {
    await sendDeleteCategoryMenu(chat.id)
  } else if (text.startsWith("/help")) {
    await sendMessage(
      chat.id,
      `ℹ️ <b>Help Guide</b>\n\n• Send any photo, video, or GIF.\n• Use /categories to delete old categories.`
    )
  } else {
    await sendMessage(chat.id, `🎬 Send me any photo, video, or GIF to add it to your gallery!`)
  }
}

async function handleUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
    } else if (
      update.message?.photo ||
      update.message?.video ||
      update.message?.animation ||
      update.message?.document
    ) {
      await handleMedia(update)
    } else if (update.message?.text) {
      await handleText(update)
    }
  } catch (error) {
    console.error("Error handling update:", error)
  }
}

async function pollUpdates(offset: number = 0): Promise<void> {
  try {
    const response = await makeRequest(`${API_URL}/getUpdates?offset=${offset}&timeout=30`)
    if (!response.ok) return

    const updates = (response.result as TelegramUpdate[]) || []
    if (updates.length > 0) {
      for (const update of updates) {
        await handleUpdate(update)
      }
      const nextOffset = updates[updates.length - 1].update_id + 1
      await pollUpdates(nextOffset)
    } else {
      await pollUpdates(offset)
    }
  } catch (error) {
    console.error("Polling error:", error)
    setTimeout(() => pollUpdates(offset), 5000)
  }
}

async function deleteWebhook(): Promise<void> {
  console.log("[Bot] Removing webhook & dropping old pending updates...")
  const response = await makeRequest(`${API_URL}/deleteWebhook`, "POST", { drop_pending_updates: true })
  if (response.ok) console.log("✅ Webhook removed & queue cleared successfully")
}

async function getMe(): Promise<void> {
  const response = await makeRequest(`${API_URL}/getMe`)
  if (response.ok && response.result) {
    const me = response.result as { username?: string }
    console.log(`✅ Bot connected: @${me.username}`)
  }
}

async function main(): Promise<void> {
  console.log("🤖 Aperture Telegram Bot starting...\n")
  await getMe()
  await deleteWebhook()
  console.log("[Bot] Polling for updates...")
  await pollUpdates()
}

main().catch(console.error)
