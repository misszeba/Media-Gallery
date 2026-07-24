/**
 * Telegram Bot API utilities for media gallery integration
 */

export interface TelegramFile {
  file_id: string
  file_unique_id: string
  file_size: number
}

export interface TelegramPhotoUpdate {
  message: {
    message_id: number
    chat: { id: number }
    photo: TelegramFile[]
    caption?: string
  }
}

export interface ParsedMediaCaption {
  title: string
  location: string
  category: string // যেকোনো কাস্টম ক্যাটাগরি সাপোর্ট করার জন্য string করা হয়েছে
  year: number
}

const TELEGRAM_API_URL = "https://api.telegram.org"

/**
 * Get file path from Telegram API
 */
export async function getTelegramFilePath(
  fileId: string,
  botToken: string
): Promise<string> {
  const response = await fetch(
    `${TELEGRAM_API_URL}/bot${botToken}/getFile?file_id=${fileId}`
  )

  if (!response.ok) {
    throw new Error(`Failed to get Telegram file: ${response.statusText}`)
  }

  const data = (await response.json()) as {
    ok: boolean
    result?: { file_path: string }
  }

  if (!data.ok || !data.result?.file_path) {
    throw new Error("Invalid Telegram API response")
  }

  return data.result.file_path
}

/**
 * Get Telegram file download URL
 */
export function getTelegramDownloadUrl(
  filePath: string,
  botToken: string
): string {
  return `${TELEGRAM_API_URL}/file/bot${botToken}/${filePath}`
}

/**
 * Parse media metadata from caption
 * Caption format: "Title|Location|Category|Year"
 */
export function parseMediaCaption(caption: string): ParsedMediaCaption | null {
  if (!caption) {
    return null
  }

  const parts = caption.split("|").map((p) => p.trim())

  if (parts.length < 4) {
    return null
  }

  return {
    title: parts[0],
    location: parts[1],
    category: parts[2] || "General",
    year: parseInt(parts[3], 10) || new Date().getFullYear(),
  }
}
