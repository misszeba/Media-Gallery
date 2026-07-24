import { NextRequest, NextResponse } from "next/server"
import { parseMediaCaption, getTelegramFilePath } from "@/lib/telegram"
import { connectToDatabase } from "@/lib/db"
import { MediaModel, CategoryModel } from "@/lib/models"
import { processTelegramUpdate } from "@/bot/telegram-bot"

export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET

    if (!botToken || !webhookSecret) {
      console.error("[v0] Telegram credentials missing")
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 500 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get("x-telegram-bot-api-secret-token")

    if (signature !== webhookSecret) {
      console.error("[v0] Invalid webhook signature")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const update = JSON.parse(body)
    
    // ১. টেলিগ্রাম বটের সব কমান্ড (/start, বাটন ক্লিক, মেসেজ উত্তর) এখানে ট্রিগার হবে
    await processTelegramUpdate(update)

    const message = update.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    // ২. মিডিয়া টাইপ এবং File ID ডিটেক্ট করা হচ্ছে (Photo, Video, GIF, Document)
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
    if (!mediaCaption) {
      console.log("[v0] Invalid caption format, skipping")
      return NextResponse.json({ ok: true })
    }

    let filePath: string
    try {
      filePath = await getTelegramFilePath(fileId, botToken)
    } catch (error) {
      console.error("[v0] Failed to get file path:", error)
      return NextResponse.json({ ok: true })
    }

    // ৩. ডাটাবেস কানেকশন ও মিডিয়া সেভ করা
    await connectToDatabase()

    const categoryName = mediaCaption.category ? mediaCaption.category.trim() : ""

    if (categoryName) {
      await CategoryModel.findOneAndUpdate(
        { name: categoryName },
        { name: categoryName },
        { upsert: true, returnDocument: "after" }
      )
    }

    const newMediaId = `telegram-${fileId.substring(0, 20)}`

    const savedMedia = await MediaModel.findOneAndUpdate(
      { telegramFileId: fileId },
      {
        $set: {
          id: newMediaId,
          title: mediaCaption.title,
          location: mediaCaption.location,
          year: mediaCaption.year,
          category: categoryName, // খালি রাখলে শুধুমাত্র "All" এ ফিল্টার হবে
          type: mediaType,
          src: `/api/media/${fileId}`,
          ratio: mediaType === "photo" ? 0.75 : 1.33,
          telegramFileId: fileId,
          telegramFilePath: filePath,
        }
      },
      { upsert: true, returnDocument: "after" }
    )

    if (savedMedia) {
      console.log("[v0] Media added to gallery MongoDB:", newMediaId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}
