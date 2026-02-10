import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zásady používání cookies',
  description: 'Informace o používání cookies na Šipkoviště.cz.',
}

export default function CookiesPage() {
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

        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Zásady používání cookies</h1>
        <p className="text-sm text-muted-foreground mb-10">Poslední aktualizace: únor 2026</p>

        <article className="space-y-10">
          {/* 1. Co jsou cookies */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">1. Co jsou cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies jsou malé textové soubory, které se ukládají ve vašem zařízení při návštěvě webu.
            </p>
          </section>

          {/* 2. Jaké cookies používáme */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">2. Jaké cookies používáme</h2>
            <p className="text-muted-foreground leading-relaxed">
              Na webu sipkoviste.cz používáme:
            </p>

            <div className="space-y-4 pl-0">
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Nezbytné cookies</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>zajišťují správné fungování webu</li>
                  <li>přihlašování uživatelů</li>
                  <li>bezpečnost webu</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2 italic">Tyto cookies nelze vypnout.</p>
              </div>

              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Analytické cookies (pokud jsou použity)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>slouží k měření návštěvnosti</li>
                  <li>pomáhají zlepšovat web</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2 italic">Používají se pouze se souhlasem uživatele.</p>
              </div>
            </div>
          </section>

          {/* 3. Jak cookies odmítnout */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">3. Jak cookies odmítnout</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies lze spravovat nebo blokovat v nastavení internetového prohlížeče.
            </p>
          </section>

          {/* 4. Kontakt */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">4. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              V případě dotazů ohledně cookies nás kontaktujte:{' '}
              <a href="mailto:info@sipkoviste.cz" className="text-primary font-medium hover:underline">info@sipkoviste.cz</a>
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/podminky" className="text-primary hover:underline">Obchodní podmínky</Link>
          <Link href="/soukromi" className="text-primary hover:underline">Ochrana osobních údajů</Link>
          <Link href="/podpora" className="text-primary hover:underline">Podpora</Link>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
