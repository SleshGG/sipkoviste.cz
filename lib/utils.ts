import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ONLINE_WITHIN_MS = 5 * 60 * 1000

export function isUserOnline(showOnlineStatus: boolean | undefined, lastSeenAt: string | null | undefined): boolean {
  if (showOnlineStatus !== true) return false
  if (!lastSeenAt) return false
  const t = new Date(lastSeenAt).getTime()
  return !Number.isNaN(t) && Date.now() - t < ONLINE_WITHIN_MS
}
