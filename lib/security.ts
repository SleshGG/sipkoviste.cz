/**
 * Bezpečnostní utility pro Šipkoviště.cz
 * - Validace URL (ochrana před javascript:, data: v obrázcích)
 * - Distribuovaný rate limiting (Redis/Upstash)
 * - Brute-force ochrana přihlášení
 */

import { Redis } from '@upstash/redis'

/** Povolené schémata pro obrázky a avatary (Supabase storage, HTTPS) */
const ALLOWED_IMAGE_SCHEMES = ['https:'] as const
const ALLOWED_IMAGE_HOSTS = [
  (url: URL) => url.hostname.endsWith('.supabase.co'),
  (url: URL) => url.hostname === 'images.unsplash.com',
]

/**
 * Ověří, že URL je bezpečná pro použití v img src.
 * Blokuje javascript:, data:, vbscript: a neznámé hosty.
 * Povoluje relativní cesty (/placeholder.svg) a HTTPS na povolených hostech.
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return false
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true
  }
  try {
    const parsed = new URL(trimmed)
    if (!ALLOWED_IMAGE_SCHEMES.includes(parsed.protocol as 'https:')) return false
    return ALLOWED_IMAGE_HOSTS.some((fn) => fn(parsed))
  } catch {
    return false
  }
}

/**
 * Vrátí bezpečnou URL pro obrázek, nebo placeholder.
 */
export function getSafeImageUrl(url: string | null | undefined, placeholder = '/placeholder.svg'): string {
  return isSafeImageUrl(url) ? url! : placeholder
}

// ============ Distribuovaný rate limiting (Redis) ============

const RATE_LIMIT_TTL_SEC = 60
const RATE_LIMIT_MAX = 30
const LOGIN_FAIL_MAX = 5
const LOGIN_BLOCK_TTL_SEC = 15 * 60 // 15 minut

/** Redis klient – podporuje KV_REST_API_* (Vercel KV) i UPSTASH_REDIS_REST_* (Upstash) */
function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

/** Fallback in-memory pro dev bez Redis (nefunguje při horizontálním škálování) */
const inMemoryMap = new Map<string, { count: number; resetAt: number }>()
const inMemoryLoginFail = new Map<string, { count: number; blockUntil: number }>()

/**
 * Distribuovaný rate limit. Klíč: rate:{type}:{identifier}
 * TTL 60 s, max 30 požadavků za okno.
 * @returns true pokud je request povolen
 */
export async function checkRateLimit(type: string, identifier: string): Promise<boolean> {
  const redis = getRedis()
  const key = `rate:${type}:${identifier}`

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, RATE_LIMIT_TTL_SEC)
      return count <= RATE_LIMIT_MAX
    } catch (e) {
      console.error('[RateLimit] Redis error:', e)
      return true
    }
  }

  // Fallback: in-memory (pouze pro dev bez Redis)
  const now = Date.now()
  const entry = inMemoryMap.get(key)
  if (!entry) {
    inMemoryMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_TTL_SEC * 1000 })
    return true
  }
  if (now > entry.resetAt) {
    inMemoryMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_TTL_SEC * 1000 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

/**
 * Brute-force ochrana: zkontroluje, zda je IP zablokovaná po neúspěšných pokusech.
 * @returns true pokud je IP zablokovaná
 */
export async function checkLoginBlock(identifier: string): Promise<boolean> {
  const redis = getRedis()
  const key = `login_fail:${identifier}`

  if (redis) {
    try {
      const count = await redis.get<number>(key)
      return (count ?? 0) >= LOGIN_FAIL_MAX
    } catch (e) {
      console.error('[RateLimit] Redis error (checkLoginBlock):', e)
      return false
    }
  }

  const entry = inMemoryLoginFail.get(key)
  if (!entry) return false
  return Date.now() < entry.blockUntil && entry.count >= LOGIN_FAIL_MAX
}

/**
 * Zaznamená neúspěšný pokus o přihlášení. Po 5 pokusech blokuje IP na 15 minut.
 * @returns true pokud je IP nyní zablokovaná
 */
export async function recordFailedLogin(identifier: string): Promise<boolean> {
  const redis = getRedis()
  const key = `login_fail:${identifier}`

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, LOGIN_BLOCK_TTL_SEC)
      return count >= LOGIN_FAIL_MAX
    } catch (e) {
      console.error('[RateLimit] Redis error (recordFailedLogin):', e)
      return false
    }
  }

  const entry = inMemoryLoginFail.get(key)
  const now = Date.now()
  if (!entry) {
    inMemoryLoginFail.set(key, { count: 1, blockUntil: now + LOGIN_BLOCK_TTL_SEC * 1000 })
    return false
  }
  entry.count++
  if (entry.count >= LOGIN_FAIL_MAX) {
    entry.blockUntil = now + LOGIN_BLOCK_TTL_SEC * 1000
    return true
  }
  return false
}

/**
 * Zaznamená úspěšné přihlášení – resetuje počítadlo neúspěšných pokusů.
 */
export async function recordSuccessfulLogin(identifier: string): Promise<void> {
  const redis = getRedis()
  const key = `login_fail:${identifier}`

  if (redis) {
    try {
      await redis.del(key)
    } catch (e) {
      console.error('[RateLimit] Redis error (recordSuccessfulLogin):', e)
    }
    return
  }

  inMemoryLoginFail.delete(key)
}
