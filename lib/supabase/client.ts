import { createBrowserClient } from '@supabase/ssr'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Chybí Supabase env. V kořeni projektu (vedle package.json) vytvoř .env.local s řádky:\n' +
        'NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co\n' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=tvuj-anon-key\n' +
        'Poté restartuj dev server (Ctrl+C a znovu pnpm run dev).'
    )
  }
  return { url, key }
}

export function createClient() {
  const { url, key } = getSupabaseEnv()
  return createBrowserClient(url, key)
}
