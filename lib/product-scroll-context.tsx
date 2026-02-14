'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

const ProductScrollContext = createContext<number>(0)

function useThrottledScroll(callback: (scrollTop: number) => void, delay: number) {
  const rafRef = useRef<number | null>(null)
  const lastCall = useRef(0)
  return useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target?.scrollTop ?? 0
    const now = Date.now()
    if (now - lastCall.current < delay && rafRef.current !== null) return
    lastCall.current = now
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      callback(scrollTop)
    })
  }, [callback, delay])
}

export function ProductScrollProvider({ header, children }: { header: ReactNode; children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0)
  const handleScrollThrottled = useThrottledScroll(setScrollY, 50)
  return (
    <ProductScrollContext.Provider value={scrollY}>
      <div className="h-[100vh] md:h-auto md:min-h-screen flex flex-col overflow-hidden md:overflow-visible">
        {header}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden md:overflow-visible md:min-h-0" onScroll={handleScrollThrottled}>
          {children}
        </div>
      </div>
    </ProductScrollContext.Provider>
  )
}

export function useProductScroll() {
  return useContext(ProductScrollContext)
}
