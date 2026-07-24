"use client"

import { useEffect, useMemo, useState } from "react"
import { Grid3x3, List } from "lucide-react"
import { GalleryTile } from "@/components/gallery-tile"
import { MediaList } from "@/components/media-list"
import { Lightbox } from "@/components/lightbox"

type Filter = "All" | string
type ViewType = "grid" | "list"

export function MediaGallery() {
  const [items, setItems] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<Filter>("All")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [viewType, setViewType] = useState<ViewType>("grid")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // পেজ লোড হলে ডাটাবেস (MongoDB Atlas) থেকে রিয়েল-টাইম ডেটা নিয়ে আসবে
  useEffect(() => {
    setIsLoading(true)
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (data.media) setItems(data.media)
        if (data.categories) setCategoriesList(data.categories)
      })
      .catch((error) => console.error("Error loading gallery data from MongoDB:", error))
      .finally(() => setIsLoading(false))
  }, [])

  const filters = useMemo(() => ["All", ...categoriesList], [categoriesList])

  const visibleItems = useMemo(
    () =>
      activeFilter === "All"
        ? items
        : items.filter((item) => item.category === activeFilter),
    [activeFilter, items],
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-10 md:flex-row md:gap-12 md:px-8 md:py-14">
        {/* Sidebar */}
        <aside className="md:sticky md:top-14 md:h-fit md:w-64 md:shrink-0">
          <header className="rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 p-5 mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
              Est. 2019
            </p>
            <h1 className="mt-3 font-heading text-5xl leading-[0.95] text-foreground md:text-6xl font-bold">
              Aperture
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A curated archive of photography and moving image — landscapes,
              architecture, portraits, and the street.
            </p>
          </header>

          <nav aria-label="Filter media by category">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">
              Categories
            </p>
            <ul className="flex flex-wrap gap-x-2 gap-y-2 md:flex-col md:gap-y-1.5">
              {filters.map((filter) => {
                const isActive = filter === activeFilter
                return (
                  <li key={filter}>
                    <button
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      aria-current={isActive ? "true" : undefined}
                      className={`px-3 py-2 rounded-md text-sm font-semibold transition-all w-full text-left ${
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {filter}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="mt-6 rounded-lg bg-muted p-3 border border-border">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-1">
              Items
            </p>
            <p className="text-2xl font-bold text-accent">
              {visibleItems.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {visibleItems.length === 1 ? "work" : "works"}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* View toggle */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewType("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewType === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="size-5" />
              </button>
              <button
                onClick={() => setViewType("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewType === "list"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="List view"
              >
                <List className="size-5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-accent">
              {viewType === "grid" ? "Grid View" : "List View"}
            </p>
          </div>

          {/* লোডিং অবস্থা হ্যান্ডেল করা */}
          {isLoading ? (
            <div className="flex h-64 w-full items-center justify-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
                Loading Gallery from Database...
              </p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-base font-semibold text-foreground">No media found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send a photo or video to your Telegram bot to add it here!
              </p>
            </div>
          ) : (
            <>
              {/* Grid view - mb-4 যুক্ত করা আছে যেন Top-Bottom এবং Left-Right গ্যাপ ১০০% সমান থাকে */}
              {viewType === "grid" && (
                <div className="[column-fill:_balance] gap-4 sm:columns-2 lg:columns-3">
                  {visibleItems.map((item) => {
                    const globalIndex = visibleItems.indexOf(item)
                    return (
                      <div key={item.id || item._id} className="mb-4 break-inside-avoid">
                        <GalleryTile
                          item={item}
                          onOpen={() => setLightboxIndex(globalIndex)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* List view */}
              {viewType === "list" && (
                <MediaList
                  items={visibleItems}
                  onItemClick={(index) => setLightboxIndex(index)}
                />
              )}
            </>
          )}

          <footer className="mt-8 border-t border-border pt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Aperture Studio — All images shown for demonstration.
          </footer>
        </main>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={visibleItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
