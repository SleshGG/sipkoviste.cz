import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Podpora',
  description: 'Kontakt k tržišti Šipkoviště.cz.',
}

export default function PodporaPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zpět na úvod
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Podpora</h1>
        <p className="text-muted-foreground mb-8">
          Máte dotaz nebo problém? Napište nám.
        </p>

        <div className="space-y-6">
          <Card className="p-6 border-border">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">E-mail</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Pro obecné dotazy, technické problémy nebo hlášení porušení pravidel.
                </p>
                <a
                  href="mailto:info@sipkoviste.cz"
                  className="text-primary hover:underline text-sm font-medium"
                >
                  info@sipkoviste.cz
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">Odpověď do 48 hodin</h2>
                <p className="text-sm text-muted-foreground">
                  Snažíme se odpovídat na e-maily obvykle do 48 hodin v pracovních dnech.
                  U urgentních záležitostí uveďte v předmětu „Urgentní“.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
