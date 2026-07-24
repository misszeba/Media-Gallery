import { NextRequest, NextResponse } from "next/server"
import { getTelegramFilePath, getTelegramDownloadUrl } from "@/lib/telegram"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 500 }
      )
    }

    // Next.js 15+ compatible async params
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID required" },
        { status: 400 }
      )
    }

    // Get file path from Telegram API
    let filePath: string
    try {
      filePath = await getTelegramFilePath(fileId, botToken)
    } catch (error) {
      console.error("[v0] Failed to get Telegram file path:", error)
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Get download URL
    const downloadUrl = getTelegramDownloadUrl(filePath, botToken)

    // Fetch file from Telegram
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      console.error("[v0] Failed to fetch from Telegram:", response.statusText)
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 404 }
      )
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    // Return file with proper headers for caching
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
        "Content-Length": buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Media proxy error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}