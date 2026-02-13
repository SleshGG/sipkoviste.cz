'use server'

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

/** Odešle e-mail. Vrací null při úspěchu, error string při chybě. */
export async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM ?? 'Šipkoviště <onboarding@resend.dev>'
  if (process.env.NODE_ENV === 'development') {
    console.log('[Email] sendEmail: to=', to, 'from=', from, 'apiKey=', apiKey ? 'nastaven' : 'CHYBÍ')
  }
  if (!apiKey?.trim()) {
    console.error('[Email] RESEND_API_KEY není nastaven v .env.local')
    return null
  }
  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({ from, to, subject, html })
    if (error) {
      console.error('[Email] Resend error:', JSON.stringify(error))
      if (error.message?.includes('403') || error.message?.includes('only send')) {
        console.error('[Email] S onboarding@resend.dev lze posílat jen na e-mail tvého Resend účtu. Pro odesílání na jiné adresy ověř doménu na resend.com/domains a nastav RESEND_FROM.')
      }
      return null
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Odesláno OK:', { to, subject, resendId: data?.id })
    }
    return null
  } catch (err) {
    console.error('[Email] Resend exception:', err)
    return null
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Získá e-mail uživatele z auth.users (vyžaduje SUPABASE_SERVICE_ROLE_KEY). */
export async function getUserEmail(userId: string): Promise<string | null> {
  if (!userId || !UUID_REGEX.test(userId)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Email] getUserEmail: neplatné userId')
    }
    return null
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!key || !url) {
    console.error('[Email] getUserEmail: chybí SUPABASE_SERVICE_ROLE_KEY nebo NEXT_PUBLIC_SUPABASE_URL')
    return null
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) {
    console.error('[Email] getUserEmail error pro', userId, ':', error.message)
    return null
  }
  const email = data?.user?.email ?? null
  if (!email && process.env.NODE_ENV === 'development') {
    console.warn('[Email] getUserEmail: e-mail pro userId', userId, 'nenalezen (auth.users)')
  }
  return email
}
