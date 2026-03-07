'use client'

import { useEffect } from 'react'

/**
 * Spustí efekt až po dokončení hydratace a když je prohlížeč v idle.
 * Snižuje TBT – těžké operace neblokují main thread při initial loadu.
 */
export function useDeferredEffect(callback: () => void | (() => void), deps: React.DependencyList) {
  useEffect(() => {
    let cleanup: void | (() => void)
    let cancelled = false

    const run = () => {
      if (cancelled) return
      cleanup = callback()
    }

    const id =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(run, { timeout: 2000 })
        : setTimeout(run, 100)

    return () => {
      cancelled = true
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(id as number)
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>)
      }
      cleanup?.()
    }
  }, deps)
}
