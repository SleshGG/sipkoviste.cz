'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Messages error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Nepodařilo se načíst zprávy</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Došlo k chybě při načítání stránky. Zkuste to prosím znovu.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset}>Zkusit znovu</Button>
          <Button variant="outline" asChild>
            <Link href="/">Zpět na úvod</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
