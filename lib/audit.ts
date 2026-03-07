/**
 * Audit log systém – loguje důležité akce bez citlivých údajů.
 * Metadata nesmí obsahovat: hesla, tokeny, refresh_token, access_token, secret.
 */

import { createClient } from '@/lib/supabase/server'

/** Akce, které se logují */
export type AuditAction =
  | 'login'
  | 'registration'
  | 'profile_update'
  | 'product_create'
  | 'product_delete'
  | 'product_price_change'
  | 'message_send'
  | 'account_delete'

/** Zakázané klíče v metadatech (citlivé údaje) */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'refresh_token',
  'access_token',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'credential',
  'private',
] as const

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  return SENSITIVE_KEYS.some((s) => lower.includes(s))
}

/** Odstraní citlivé údaje z objektu (rekurzivně). */
export function sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (isSensitiveKey(k)) continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      result[k] = sanitizeMetadata(v as Record<string, unknown>)
    } else {
      result[k] = v
    }
  }
  return result
}

async function getClientIp(): Promise<string | null> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
}

/**
 * Zaloguje audit událost.
 * @param userId – ID uživatele (null pro anonymní akce)
 * @param action – typ akce
 * @param metadata – metadata (resource_id, changed_values, …) – automaticky sanitizována
 */
export async function auditLog(
  userId: string | null,
  action: AuditAction,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = await createClient()
    const ip = await getClientIp()
    const safeMeta = sanitizeMetadata(metadata)

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      metadata: safeMeta,
      ip_address: ip,
    })
  } catch (err) {
    console.error('[audit] Failed to log:', action, err)
  }
}
