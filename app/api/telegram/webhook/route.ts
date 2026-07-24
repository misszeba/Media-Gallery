import { NextRequest, NextResponse } from "next/server"
import { parseMediaCaption, getTelegramFilePath } from "@/lib/telegram"
import { connectToDatabase } from "@/lib/db"
import { MediaModel, CategoryModel } from "@/lib/models"

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
    const message = update.message
    if (!message) return NextResponse.json({ ok: true })

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
    if (!mediaCaption) return NextResponse.json({ ok: true })

    let filePath = ""
    try {
      filePath = await getTelegramFilePath(fileId, botToken)
    } catch (error) {
      console.error("[v0] Failed to get file path:", error)
    }

    // ডাটাবেস কানেকশন
    await connectToDatabase()

    const categoryName = mediaCaption.category ? mediaCaption.category.trim() : ""

    // নতুন ক্যাটাগরি হলে ডাটাবেসে যুক্ত করা
    if (categoryName) {
      await CategoryModel.findOneAndUpdate(
        { name: categoryName },
        { name: categoryName },
        { upsert: true, new: true }
      )
    }

    // মিডিয়া সেভ করা (আগে থেকে থাকলে স্কিপ করবে)
    await MediaModel.findOneAndUpdate(
      { telegramFileId: fileId },
      {
        title: mediaCaption.title,
        location: mediaCaption.location,
        year: mediaCaption.year,
        category: categoryName,
        type: mediaType,
        src: `/api/media/${fileId}`,
        ratio: mediaType === "photo" ? 0.75 : 1.33,
        telegramFileId: fileId,
        telegramFilePath: filePath,
      },
      { upsert: true, new: true }
    )

    console.log("[v0] Media saved to MongoDB:", fileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}
