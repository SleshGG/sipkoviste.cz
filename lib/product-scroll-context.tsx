'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const ProductScrollContext = createContext<number>(0)

export function ProductScrollProvider({ header, children }: { header: ReactNode; children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop)
  }, [])
  return (
    <ProductScrollContext.Provider value={scrollY}>
      <div className="h-[100dvh] md:h-auto md:min-h-screen flex flex-col overflow-hidden md:overflow-visible">
        {header}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden md:overflow-visible md:min-h-0" onScroll={handleScroll}>
          {children}
        </div>
      </div>
    </ProductScrollContext.Provider>
  )
}

export function useProductScroll() {
  return useContext(ProductScrollContext)
}
