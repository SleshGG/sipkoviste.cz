'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateLastSeenAction } from '@/lib/supabase/actions'

const INTERVAL_MS = 60_000

/** Při přihlášení každou minutu aktualizuje last_seen_at v profilu. */
export function LastSeenUpdater() {
  useEffect(() => {
    const supabase = createClient()
    let interval: ReturnType<typeof setInterval> | null = null

    const run = () => updateLastSeenAction()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      run()
      interval = setInterval(run, INTERVAL_MS)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (interval) clearInterval(interval)
      interval = null
      if (!session?.user) return
      run()
      interval = setInterval(run, INTERVAL_MS)
    })

    return () => {
      subscription.unsubscribe()
      if (interval) clearInterval(interval)
    }
  }, [])

  return null
}
