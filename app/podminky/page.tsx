import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { ArrowLeft, Mail, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Obchodní podmínky',
  description: 'Obchodní podmínky a pravidla užívání inzertní platformy Šipkoviště.cz.',
}

export default function PodminkyPage() {
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

        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Obchodní podmínky</h1>
        <p className="text-sm text-muted-foreground mb-10">Poslední aktualizace: únor 2026</p>

        <article className="space-y-10">
          {/* 1. Úvodní ustanovení */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">1. Úvodní ustanovení</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tyto obchodní podmínky upravují používání internetové platformy sipkoviste.cz (dále jen „platforma“), která slouží k vkládání a prohlížení inzerátů týkajících se šipkařského vybavení.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">Provozovatelem platformy je:</p>
              <p className="text-sm text-muted-foreground font-medium">Lukáš Rydval</p>
              <p className="text-sm text-muted-foreground">IČO: 06718248</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                Sídlo: Sušice
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                E-mail: <a href="mailto:info@sipkoviste.cz" className="text-primary hover:underline">info@sipkoviste.cz</a>
              </p>
              <p className="text-sm text-muted-foreground pt-1">(dále jen „provozovatel“)</p>
            </div>
          </section>

          {/* 2. Charakter služby */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">2. Charakter služby</h2>
            <p className="text-muted-foreground leading-relaxed">
              Platforma slouží jako inzertní prostor mezi uživateli.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Provozovatel není prodávajícím ani kupujícím.
            </p>
            <p className="text-muted-foreground leading-relaxed">Provozovatel nezodpovídá za:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>pravdivost inzerátů,</li>
              <li>kvalitu nebo stav zboží,</li>
              <li>průběh a výsledek transakce mezi uživateli.</li>
            </ul>
          </section>

          {/* 3. Registrace uživatele */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">3. Registrace uživatele</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
              <li>Pro využívání některých funkcí může být vyžadována registrace.</li>
              <li>Uživatel je povinen uvádět pravdivé a aktuální údaje.</li>
              <li>Uživatel odpovídá za zabezpečení svého účtu.</li>
            </ul>
          </section>

          {/* 4. Vkládání inzerátů */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">4. Vkládání inzerátů</h2>
            <p className="text-muted-foreground leading-relaxed">Uživatel smí vkládat pouze inzeráty:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>týkající se šipkařského vybavení,</li>
              <li>které neporušují právní předpisy.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed pt-2">Zakázáno je zejména:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>prodávat nelegální zboží,</li>
              <li>uvádět klamavé informace,</li>
              <li>porušovat autorská práva.</li>
            </ul>
          </section>

          {/* 5. Práva provozovatele */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">5. Práva provozovatele</h2>
            <p className="text-muted-foreground leading-relaxed">Provozovatel si vyhrazuje právo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>odstranit inzerát porušující pravidla,</li>
              <li>zablokovat nebo zrušit účet uživatele,</li>
              <li>upravit nebo ukončit službu.</li>
            </ul>
          </section>

          {/* 6. Poplatky */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">6. Poplatky</h2>
            <p className="text-muted-foreground leading-relaxed">
              V současné době je vkládání inzerátů zdarma.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Provozovatel si vyhrazuje právo zavést placené služby v budoucnu.
            </p>
          </section>

          {/* 7. Odpovědnost */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">7. Odpovědnost</h2>
            <p className="text-muted-foreground leading-relaxed">Provozovatel nenese odpovědnost za:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>škody vzniklé mezi uživateli,</li>
              <li>zneužití účtu třetí osobou.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed pt-2">
              Uživatel používá platformu na vlastní odpovědnost.
            </p>
          </section>

          {/* 8. Závěrečná ustanovení */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">8. Závěrečná ustanovení</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Tyto podmínky se řídí právem České republiky.</li>
              <li>Provozovatel si vyhrazuje právo podmínky kdykoliv změnit.</li>
            </ul>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/soukromi" className="text-primary hover:underline">Ochrana soukromí</Link>
          <Link href="/podpora" className="text-primary hover:underline">Podpora</Link>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
