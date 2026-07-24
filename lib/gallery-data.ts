import galleryData from "@/data/gallery.json"

export type MediaCategory = string

export type MediaType = "photo" | "video" | "gif"

export interface MediaItem {
  id: string
  title: string
  location: string
  year: number
  category: string // খালি স্ট্রিং ("") থাকলে এটি শুধুমাত্র "All" ট্যাবে দেখাবে
  type: MediaType
  src: string
  ratio: number
  telegramFileId?: string
  telegramFilePath?: string
}

export const categories: MediaCategory[] =
  galleryData.categories as MediaCategory[]

export const mediaItems: MediaItem[] = galleryData.media as MediaItem[]
