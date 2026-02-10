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

/** Formátuje „členem od“: podporuje jen rok (YYYY) nebo celé datum (ISO). */
export function formatMemberSince(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—'
  const v = value.trim()
  if (v.length === 4 && /^\d{4}$/.test(v)) return `od roku ${v}`
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}
