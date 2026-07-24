"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import type { MediaItem } from "@/lib/gallery-data"

interface MediaListProps {
  items: MediaItem[]
  onItemClick: (index: number) => void
}

export function MediaList({ items, onItemClick }: MediaListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <MediaListItem
          key={item.id}
          item={item}
          onClick={() => onItemClick(index)}
        />
      ))}
    </div>
  )
}

/* প্রতিটি লিস্ট আইটেমের জন্য আলাদা সাব-কম্পোনেন্ট (Hover Timer হ্যান্ডেল করার জন্য) */
function MediaListItem({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleMouseEnter = () => {
    if (item.type !== "video") return

    hoverTimerRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true)
        }).catch(() => {})
      }
    }, 2000) // ২ সেকেন্ড ডিলে
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }

    if (item.type === "video" && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex w-full gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:border-accent hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {item.type === "video" ? (
          <video
            ref={videoRef}
            src={item.src}
            muted
            playsInline
            loop
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Image
            src={item.src || "/placeholder.svg"}
            alt={item.title}
            width={80}
            height={80}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={item.type === "gif"}
          />
        )}

        {/* ভিডিও প্লে না হলে প্লে আইকন দেখাবে */}
        {item.type === "video" && !isPlaying && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-[1px]">
            <Play className="size-5 fill-accent text-accent transition-transform duration-300 group-hover:scale-125" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 text-left">
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground group-hover:text-accent">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {item.location} — {item.year}
        </p>
        <p className="text-xs font-medium text-accent/80">
          {item.category || "Uncategorized"}
        </p>
      </div>

      <div className="flex items-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {item.type === "video" ? "🎬 Video" : item.type === "gif" ? "🎞️ GIF" : "📸 Photo"}
      </div>
    </button>
  )
}
