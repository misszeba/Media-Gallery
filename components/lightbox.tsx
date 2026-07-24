"use client"

import { useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { MediaItem } from "@/lib/gallery-data"

interface LightboxProps {
  items: MediaItem[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const item = items[index]
  const videoRef = useRef<HTMLVideoElement>(null)

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + items.length) % items.length)
  }, [index, items.length, onNavigate])

  const goNext = useCallback(() => {
    onNavigate((index + 1) % items.length)
  }, [index, items.length, onNavigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose, goPrev, goNext])

  useEffect(() => {
    if (item?.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [index, item])

  if (!item) return null

  // ৫টি শব্দের বেশি হলে কেটে "....." বসিয়ে দেওয়ার লজিক
  const words = item.title.trim().split(/\s+/)
  const truncatedTitle =
    words.length > 5 ? words.slice(0, 5).join(" ") + "....." : item.title

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 flex flex-col bg-foreground/95 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="text-background">
          {/* এখানে পুরো টাইটেলের বদলে truncatedTitle রেন্ডার করা হচ্ছে */}
          <p
            className="font-heading text-lg leading-tight md:text-xl"
            title={item.title} // মাউস রাখলে যেন পুরো টাইটেল দেখা যায়, তাই title অ্যাট্রিবিউট দেওয়া হলো
          >
            {truncatedTitle}
          </p>
          <p className="text-xs text-background/60">
            {item.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="rounded-full p-2 text-background/80 transition-colors hover:bg-background/10 hover:text-background"
        >
          <X className="size-6" />
        </button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6 md:px-16">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous item"
          className="absolute left-2 z-10 rounded-full p-2 text-background/70 transition-colors hover:bg-background/10 hover:text-background md:left-6"
        >
          <ChevronLeft className="size-7 md:size-9" />
        </button>

        <figure className="relative flex max-h-full max-w-full items-center justify-center">
          <div className="relative max-h-[78vh] max-w-[86vw] flex items-center justify-center">
            {item.type === "video" ? (
              <video
                ref={videoRef}
                src={item.src}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] max-w-[86vw] rounded-sm object-contain outline-none shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={item.src || "/placeholder.svg"}
                alt={item.title}
                width={1200}
                height={1200}
                className="max-h-[78vh] w-auto rounded-sm object-contain"
                priority
                unoptimized={item.type === "gif"}
              />
            )}
          </div>
        </figure>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next item"
          className="absolute right-2 z-10 rounded-full p-2 text-background/70 transition-colors hover:bg-background/10 hover:text-background md:right-6"
        >
          <ChevronRight className="size-7 md:size-9" />
        </button>
      </div>

      <footer className="px-4 pb-5 text-center text-xs uppercase tracking-[0.2em] text-background/50">
        {index + 1} / {items.length} — {item.category || "All"}
      </footer>
    </div>
  )
}
