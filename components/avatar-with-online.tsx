'use client'

import Image from 'next/image'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLACEHOLDER_AVATAR = '/placeholder.svg'

interface AvatarWithOnlineProps {
  src: string
  alt: string
  isOnline?: boolean
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  fill?: boolean
  sizes?: string
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8 sm:h-10 sm:w-10',
  md: 'h-10 w-10 sm:h-12 sm:w-12',
  lg: 'h-12 w-12 sm:h-14 sm:w-14',
}

/** Zelené kolečko v pravém dolním rohu na fotce – více na kruhu, méně venku */
const dotScale = {
  xs: 'h-1.5 w-1.5 right-0 bottom-0',
  sm: 'h-2 w-2 sm:h-2.5 sm:w-2.5 right-0 bottom-0',
  md: 'h-2.5 w-2.5 sm:h-3 sm:w-3 right-0 bottom-0',
  lg: 'h-3 w-3 sm:h-3.5 sm:w-3.5 right-0 bottom-0',
}

export function AvatarWithOnline({
  src,
  alt,
  isOnline = false,
  className,
  size = 'md',
  fill = true,
  sizes,
}: AvatarWithOnlineProps) {
  const hasRealAvatar = src && src !== PLACEHOLDER_AVATAR
  return (
    <div className={cn('relative shrink-0 overflow-visible', className)}>
      <div
        className={cn(
          'relative rounded-full bg-secondary',
          sizeClasses[size]
        )}
      >
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {hasRealAvatar ? (
            <Image
              src={src}
              alt={alt}
              fill={fill}
              sizes={sizes ?? '56px'}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <User className="h-[50%] w-[50%]" aria-hidden />
            </div>
          )}
        </div>
        {isOnline && (
          <span
            className={cn(
              'absolute rounded-full bg-green-500',
              dotScale[size]
            )}
            title="Online"
            aria-hidden
          />
        )}
      </div>
    </div>
  )
}
