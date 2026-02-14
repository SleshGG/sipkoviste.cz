import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { ArrowLeft, Mail, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů',
  description: 'Zásady ochrany osobních údajů na Šipkoviště.cz.',
}

export default function SoukromiPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
          aria-label="Zpět na úvod"
        >
          <ArrowLeft className="size-5 shrink-0" strokeWidth={2} />
        </Link>

        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Ochrana osobních údajů</h1>
        <p className="text-sm text-muted-foreground mb-10">Poslední aktualizace: únor 2026</p>

        <article className="space-y-10">
          {/* 1. Správce osobních údajů */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">1. Správce osobních údajů</h2>
            <p className="text-muted-foreground leading-relaxed">Správcem osobních údajů je:</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">Lukáš Rydval</p>
              <p className="text-sm text-muted-foreground">IČO: 06718248</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                Sídlo: Sušice
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                E-mail: <a href="mailto:info@sipkoviste.cz" className="text-primary hover:underline">info@sipkoviste.cz</a>
              </p>
            </div>
          </section>

          {/* 2. Jaké údaje zpracováváme */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">2. Jaké údaje zpracováváme</h2>
            <p className="text-muted-foreground leading-relaxed">Zpracováváme pouze údaje, které nám uživatel poskytne:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>jméno nebo přezdívka</li>
              <li>e-mailová adresa</li>
              <li>případně další údaje uvedené v profilu nebo inzerátu</li>
            </ul>
          </section>

          {/* 3. Účel zpracování */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">3. Účel zpracování</h2>
            <p className="text-muted-foreground leading-relaxed">Osobní údaje zpracováváme za účelem:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>vytvoření a správy uživatelského účtu</li>
              <li>provozu inzertní platformy</li>
              <li>komunikace s uživateli</li>
              <li>plnění zákonných povinností</li>
            </ul>
          </section>

          {/* 4. Doba uchování údajů */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">4. Doba uchování údajů</h2>
            <p className="text-muted-foreground leading-relaxed">Osobní údaje uchováváme:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>po dobu trvání uživatelského účtu</li>
              <li>nebo po dobu nutnou k plnění zákonných povinností</li>
            </ul>
          </section>

          {/* 5. Předávání údajů třetím stranám */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">5. Předávání údajů třetím stranám</h2>
            <p className="text-muted-foreground leading-relaxed">Osobní údaje nepředáváme třetím stranám, s výjimkou:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>poskytovatelů technických služeb (hosting apod.)</li>
              <li>případů vyžadovaných zákonem</li>
            </ul>
          </section>

          {/* 6. Práva uživatele */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">6. Práva uživatele</h2>
            <p className="text-muted-foreground leading-relaxed">Uživatel má právo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>na přístup ke svým údajům</li>
              <li>na opravu údajů</li>
              <li>na výmaz údajů</li>
              <li>na omezení zpracování</li>
              <li>vznést námitku</li>
              <li>podat stížnost u Úřadu pro ochranu osobních údajů</li>
            </ul>
          </section>

          {/* 7. Kontakt */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">7. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              V případě dotazů ohledně osobních údajů nás kontaktujte na:{' '}
              <a href="mailto:info@sipkoviste.cz" className="text-primary font-medium hover:underline">info@sipkoviste.cz</a>
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/podminky" className="text-primary hover:underline">Obchodní podmínky</Link>
          <Link href="/podpora" className="text-primary hover:underline">Podpora</Link>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
