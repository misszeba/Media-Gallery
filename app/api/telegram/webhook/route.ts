import { NextRequest, NextResponse } from "next/server"
import { parseMediaCaption, getTelegramFilePath } from "@/lib/telegram"
import { connectToDatabase } from "@/lib/db"
import { MediaModel, CategoryModel } from "@/lib/models"

// টেলিগ্রাম এপিআই-তে রিকোয়েস্ট পাঠানোর হেল্পার ফাংশন (ডায়নামিক টোকেন লোডিং)
async function makeTelegramRequest(endpoint: string, body: any) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return
    const apiUrl = `https://api.telegram.org/bot${botToken}`

    await fetch(`${apiUrl}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (error) {
    console.error(`Error sending to Telegram (${endpoint}):`, error)
  }
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  return makeTelegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  })
}

// ডাটাবেস থেকে ক্যাটাগরি লিস্ট আনার ফাংশন
async function getCategories(): Promise<string[]> {
  try {
    const cats = await CategoryModel.find().select("name -_id").lean()
    if (!cats || cats.length === 0) {
      const defaultCats = ["Landscapes", "Architecture", "Portraits", "Street"]
      for (const name of defaultCats) {
        await CategoryModel.findOneAndUpdate({ name }, { name }, { upsert: true, returnDocument: "after" })
      }
      return defaultCats
    }
    return cats.map((c: any) => c.name)
  } catch (e) {
    return ["Landscapes", "Architecture", "Portraits", "Street"]
  }
}

// ছবি/ভিডিও আসার পর ক্যাটাগরি বাটন পাঠানোর ফাংশন (Telegram 64-byte limit fix করা হয়েছে)
async function sendCategoryButtons(chatId: number, shortId: string, title: string) {
  const categories = await getCategories()
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = []

  for (let i = 0; i < categories.length; i += 2) {
    const row = []
    row.push({ text: `📁 ${categories[i]}`, callback_data: `cat:${categories[i]}:${shortId}` })
    if (categories[i + 1]) {
      row.push({ text: `📁 ${categories[i + 1]}`, callback_data: `cat:${categories[i + 1]}:${shortId}` })
    }
    keyboard.push(row)
  }

  keyboard.push([
    { text: "⏭️ Skip Category (Show in All)", callback_data: `skip:${shortId}` },
    { text: "➕ New Category", callback_data: `new:${shortId}` },
  ])

  if (categories.length > 0) {
    keyboard.push([{ text: "🗑️ Manage/Delete Categories", callback_data: `del_menu:${shortId}` }])
  }

  await sendMessage(
    chatId,
    `🎬 <b>Media Received & Saved!</b>\n\n<b>Title:</b> ${title}\n\n🗂️ <b>Select a category for this media:</b>`,
    { inline_keyboard: keyboard }
  )
}

// ক্যাটাগরি ডিলিট করার মেনু পাঠানোর ফাংশন
async function sendDeleteCategoryMenu(chatId: number, messageId?: number) {
  const categories = await getCategories()
  if (categories.length === 0) {
    await sendMessage(chatId, "ℹ️ No categories available to delete.")
    return
  }

  const keyboard = categories.map((cat) => [
    { text: `🗑️ Delete "${cat}"`, callback_data: `del_cat:${cat}` },
  ])
  keyboard.push([{ text: "❌ Close Menu", callback_data: "close_menu" }])

  const text = "🗑️ <b>Delete Category Menu:</b>\n\nSelect a category to delete. Media under this category will display directly under <b>'All'</b>."

  if (messageId) {
    await makeTelegramRequest("editMessageText", {
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

// বাটন ক্লিক করার পর মিডিয়ার ক্যাটাগরি আপডেট করার ফাংশন
async function finalizeMediaUpload(shortId: string, category: string, chatId: number, buttonMessageId?: number) {
  try {
    // shortId দিয়ে ডাটাবেস থেকে সঠিক মিডিয়াটি আপডেট করা হচ্ছে
    const updatedMedia = await MediaModel.findOneAndUpdate(
      { id: { $regex: shortId } },
      { $set: { category: category } },
      { returnDocument: "after" }
    )

    if (!updatedMedia) {
      await sendMessage(chatId, "❌ Could not find media in database.")
      return
    }

    const displayCat = category ? `📁 ${category}` : "🌐 None (Visible in 'All' only)"
    const confirmationText = `✅ <b>Media Added Successfully!</b>\n\n<b>Title:</b> ${updatedMedia.title}\n<b>Category:</b> ${displayCat}\n<b>Location:</b> ${updatedMedia.location}\n<b>Year:</b> ${updatedMedia.year}\n\nYour media is now live on the gallery!`

    if (buttonMessageId) {
      await makeTelegramRequest("editMessageText", {
        chat_id: chatId,
        message_id: buttonMessageId,
        text: confirmationText,
        parse_mode: "HTML",
      })
    } else {
      await sendMessage(chatId, confirmationText)
    }
  } catch (error) {
    console.error("Error finalizing media:", error)
  }
}

// মূল Webhook API রুট (যেখানে টেলিগ্রাম থেকে সব ডেটা আসে)
export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET

    if (!botToken || !webhookSecret) {
      return NextResponse.json({ error: "Telegram not configured" }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get("x-telegram-bot-api-secret-token")

    if (signature !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const update = JSON.parse(body)
    await connectToDatabase()

    // ১. বাটন ক্লিক (Callback Query) হ্যান্ডেল করা
    if (update.callback_query) {
      const { id, message, data } = update.callback_query
      await makeTelegramRequest("answerCallbackQuery", { callback_query_id: id })

      if (data.startsWith("del_cat:")) {
        const catToDelete = data.replace("del_cat:", "")
        await CategoryModel.deleteOne({ name: catToDelete })
        await MediaModel.updateMany({ category: catToDelete }, { $set: { category: "" } })
        
        await makeTelegramRequest("editMessageText", {
          chat_id: message.chat.id,
          message_id: message.message_id,
          text: `✅ Category <b>"${catToDelete}"</b> deleted successfully!\nAll media under this category will now show in 'All'.`,
          parse_mode: "HTML",
        })
        return NextResponse.json({ ok: true })
      }

      if (data === "close_menu") {
        await makeTelegramRequest("deleteMessage", { chat_id: message.chat.id, message_id: message.message_id })
        return NextResponse.json({ ok: true })
      }

      const parts = data.split(":")
      const action = parts[0]
      const shortId = parts[parts.length - 1]

      if (action === "del_menu") {
        await sendDeleteCategoryMenu(message.chat.id, message.message_id)
        return NextResponse.json({ ok: true })
      }

      if (action === "cat") {
        const selectedCat = parts.slice(1, -1).join(":")
        await finalizeMediaUpload(shortId, selectedCat, message.chat.id, message.message_id)
      } else if (action === "skip") {
        await finalizeMediaUpload(shortId, "", message.chat.id, message.message_id)
      } else if (action === "new") {
        await MediaModel.findOneAndUpdate({ id: { $regex: shortId } }, { $set: { location: "WAITING_NEW_CAT" } })
        await sendMessage(message.chat.id, `➕ <b>Create New Category</b>\n\nPlease type and send the name for your new category:`)
      }
      return NextResponse.json({ ok: true })
    }

    // ২. টেক্সট মেসেজ ও কমান্ড (/start, /help) হ্যান্ডেল করা
    if (update.message?.text) {
      const { chat, text } = update.message

      // নতুন ক্যাটাগরির নাম লিখে পাঠালে সেটি চেক করা হচ্ছে
      const waitingMedia = await MediaModel.findOne({ location: "WAITING_NEW_CAT" })
      if (waitingMedia) {
        const newCategory = text.trim()
        await CategoryModel.findOneAndUpdate({ name: newCategory }, { name: newCategory }, { upsert: true, returnDocument: "after" })
        await MediaModel.findOneAndUpdate({ _id: waitingMedia._id }, { $set: { location: "Unknown Location" } })
        
        const shortId = waitingMedia.id.replace("telegram-", "").substring(0, 20)
        await finalizeMediaUpload(shortId, newCategory, chat.id)
        return NextResponse.json({ ok: true })
      }

      if (text.startsWith("/start")) {
        await sendMessage(
          chat.id,
          `👋 <b>Welcome to Aperture Bot!</b>\n\nI support Photos, Videos, GIFs, and Documents!\n\n📸 <b>How to use:</b>\n1. Simply send any media file.\n2. Choose a category, skip, or create a new one!\n\n<b>Management:</b>\nUse /categories to manage or delete existing categories.`
        )
      } else if (text.startsWith("/categories") || text.startsWith("/del_category")) {
        await sendDeleteCategoryMenu(chat.id)
      } else if (text.startsWith("/help")) {
        await sendMessage(chat.id, `ℹ️ <b>Help Guide</b>\n\n• Send any photo, video, or GIF.\n• Use /categories to delete old categories.`)
      } else {
        await sendMessage(chat.id, `🎬 Send me any photo, video, or GIF to add it to your gallery!`)
      }
      return NextResponse.json({ ok: true })
    }

    // ৩. মিডিয়া ফাইল (ছবি/ভিডিও/GIF) হ্যান্ডেল করা ও ডাটাবেসে সেভ করা
    const message = update.message
    if (message?.photo || message?.video || message?.animation || message?.document) {
      let fileId = ""
      let mediaType: "photo" | "video" | "gif" = "photo"

      if (message.photo?.length) {
        fileId = message.photo[message.photo.length - 1].file_id
        mediaType = "photo"
      } else if (message.video) {
        fileId = message.video.file_id
        mediaType = "video"
      } else if (message.animation) {
        fileId = message.animation.file_id
        mediaType = "gif"
      } else if (message.document) {
        fileId = message.document.file_id
        const mime = message.document.mime_type || ""
        if (mime.startsWith("video")) mediaType = "video"
        else if (mime.includes("gif")) mediaType = "gif"
        else mediaType = "photo"
      } else {
        return NextResponse.json({ ok: true })
      }

      const mediaCaption = parseMediaCaption(message.caption || "")
      let filePath = ""
      try {
        filePath = await getTelegramFilePath(fileId, botToken)
      } catch (error) {
        console.error("[v0] Failed to get file path:", error)
      }

      const categoryName = mediaCaption?.category ? mediaCaption.category.trim() : ""
      if (categoryName) {
        await CategoryModel.findOneAndUpdate({ name: categoryName }, { name: categoryName }, { upsert: true, returnDocument: "after" })
      }

      const title = mediaCaption?.title || "Untitled Media"
      const shortId = fileId.substring(0, 20)
      const newMediaId = `telegram-${shortId}`

      // ডাটাবেসে মিডিয়া সেভ করা
      await MediaModel.findOneAndUpdate(
        { telegramFileId: fileId },
        {
          $set: {
            id: newMediaId,
            title: title,
            location: mediaCaption?.location || "Unknown Location",
            year: mediaCaption?.year || new Date().getFullYear(),
            category: categoryName,
            type: mediaType,
            src: `/api/media/${fileId}`,
            ratio: mediaType === "photo" ? 0.75 : 1.33,
            telegramFileId: fileId,
            telegramFilePath: filePath,
          }
        },
        { upsert: true, returnDocument: "after" }
      )

      console.log("[v0] Media saved to MongoDB:", fileId)
      
      // ছবি আসার সাথে সাথেই ইউজারকে ক্যাটাগরি বাটন পাঠানো হচ্ছে (Telegram 64-byte limit fix)
      await sendCategoryButtons(message.chat.id, shortId, title)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}
