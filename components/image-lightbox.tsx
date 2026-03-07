'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageLightboxProps {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
  /** Container className (e.g. "relative h-20 w-20") - required when using fill */
  containerClassName?: string
  /** Pro galerii: zobrazit předchozí/další a otevřít na daném indexu */
  images?: string[]
  initialIndex?: number
}

export function ImageLightbox({
  src,
  alt,
  sizes,
  className = 'object-cover',
  containerClassName = 'relative w-full h-full',
  images,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false)
  const list = images && images.length > 0 ? images : [src]
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const currentSrc = list[currentIndex] || src

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex)
  }, [open, initialIndex])

  const openLightbox = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex(images ? initialIndex : 0)
    setOpen(true)
  }

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i <= 0 ? list.length - 1 : i - 1))
  }

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i >= list.length - 1 ? 0 : i + 1))
  }

  return (
    <>
      <div className={containerClassName}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
        />
        <button
          type="button"
          onClick={openLightbox}
          className="absolute inset-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
          aria-label="Zvětšit obrázek"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] w-auto max-h-[calc(100vh-2rem)] p-0 border-0 bg-transparent shadow-none overflow-visible"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">{alt || 'Náhled obrázku'}</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[200px] bg-black/90 rounded-lg">
            <div className="relative max-w-[calc(100vw-4rem)] max-h-[calc(100vh-5rem)] w-full h-full flex items-center justify-center">
              <Image
                src={currentSrc}
                alt={alt}
                width={1200}
                height={900}
                className="object-contain max-h-[calc(100vh-5rem)] w-auto h-auto"
                onClick={(e) => e.stopPropagation()}
                unoptimized={currentSrc.startsWith('blob:') || currentSrc === '/placeholder.svg'}
              />
            </div>
            {list.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100"
                  onClick={goPrev}
                  aria-label="Předchozí obrázek"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-90 hover:opacity-100"
                  onClick={goNext}
                  aria-label="Další obrázek"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {currentIndex + 1} / {list.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
