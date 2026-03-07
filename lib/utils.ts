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

/** Vrací text „Online“ nebo „Naposledy před X“ – jen když show_online_status je true. Jinak null. */
export function formatLastSeen(showOnlineStatus: boolean | undefined, lastSeenAt: string | null | undefined): string | null {
  if (showOnlineStatus !== true) return null
  if (!lastSeenAt) return null
  const t = new Date(lastSeenAt).getTime()
  if (Number.isNaN(t)) return null
  const diffMs = Date.now() - t
  if (diffMs < ONLINE_WITHIN_MS) return 'Online'
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `Naposledy před ${diffMins} min`
  if (diffHours < 24) return `Naposledy před ${diffHours} hod`
  if (diffDays < 7) return `Naposledy před ${diffDays} dny`
  return `Naposledy před ${Math.floor(diffDays / 7)} týdny`
}

/** Vrací text pro „Naposledy online:“ s českou pluralizací (před 1 minutou, před 2 hodinami). */
export function formatLastSeenLabel(showOnlineStatus: boolean | undefined, lastSeenAt: string | null | undefined): string | null {
  if (showOnlineStatus !== true) return null
  if (!lastSeenAt) return null
  const t = new Date(lastSeenAt).getTime()
  if (Number.isNaN(t)) return null
  const diffMs = Date.now() - t
  if (diffMs < ONLINE_WITHIN_MS) return 'právě teď'
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const plural = (n: number, one: string, few: string, many: string) =>
    n === 1 ? one : n >= 2 && n <= 4 ? few : many
  if (diffMins < 60) return `před ${diffMins} ${plural(diffMins, 'minutou', 'minutami', 'minutami')}`
  if (diffHours < 24) return `před ${diffHours} ${plural(diffHours, 'hodinou', 'hodinami', 'hodinami')}`
  if (diffDays < 7) return `před ${diffDays} ${plural(diffDays, 'dnem', 'dny', 'dny')}`
  const weeks = Math.floor(diffDays / 7)
  return `před ${weeks} ${plural(weeks, 'týdnem', 'týdny', 'týdny')}`
}

/** Vrací datum ve formátu d.m.yyyy pro text „Členem od …“. Rok (YYYY) zobrazí jako 1.1.YYYY. */
export function formatMemberSince(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—'
  const v = value.trim()
  if (v.length === 4 && /^\d{4}$/.test(v)) return `1.1.${v}`
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}
