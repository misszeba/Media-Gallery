"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import type { MediaItem } from "@/lib/gallery-data"

interface GalleryTileProps {
  item: MediaItem
  onOpen: () => void
}

export function GalleryTile({ item, onOpen }: GalleryTileProps) {
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
    }, 2000)
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
    <div
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-lg bg-muted border border-border transition-all duration-300 hover:shadow-xl hover:border-accent"
    >
      <div className="relative w-full overflow-hidden flex items-center justify-center">
        {item.type === "video" ? (
          <video
            ref={videoRef}
            src={item.src}
            muted
            playsInline
            loop
            className="block w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Image
            src={item.src || "/placeholder.svg"}
            alt={item.title}
            width={600}
            height={800}
            className="block w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={item.type === "gif"}
          />
        )}

        {item.type === "video" && !isPlaying && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-80">
            <span className="flex size-14 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 size-6 fill-current text-accent" />
            </span>
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="font-heading text-base font-semibold text-background">
          {item.title}
        </h3>
        <p className="text-xs text-background/75 mt-0.5">
          {item.location} — {item.year}
        </p>
        <span className="inline-block mt-2 rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          {item.category || "All"}
        </span>
      </div>
    </div>
  )
}
