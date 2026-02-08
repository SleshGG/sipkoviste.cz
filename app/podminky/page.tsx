import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Podmínky užívání',
  description: 'Obchodní podmínky a pravidla užívání tržiště Šipkoviště.cz.',
}

export default function PodminkyPage() {
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
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Podmínky užívání</h1>
        <p className="text-sm text-muted-foreground mb-8">Poslední aktualizace: únor 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Úvod</h2>
            <p>
              Vítejte na Šipkoviště.cz (dále jen „platforma“). Používáním této platformy souhlasíte s těmito podmínkami.
              Platforma slouží jako tržiště pro nákup a prodej šipek, terčů a souvisejícího příslušenství.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Registrace a účet</h2>
            <p>
              Pro plné využití služeb je nutná registrace. Jste odpovědni za ochranu přihlašovacích údajů a za veškerou
              činnost pod vaším účtem. Údaje uváděné v inzerátech musí být pravdivé a odpovídat skutečnosti.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Inzeráty a obchodování</h2>
            <p>
              Inzeráty smíte vkládat v souladu s pravidly platformy. Zakázán je prodej nelegálních předmětů,
              podvodné jednání a opakované porušování pravidel. Transakce probíhají přímo mezi kupujícím a prodejcem;
              platforma není stranou smlouvy a neodpovídá za plnění mezi uživateli.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Ochrana osobních údajů</h2>
            <p>
              Zpracování osobních údajů upravuje stránka{' '}
              <Link href="/soukromi" className="text-primary hover:underline">Ochrana soukromí</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Změny a kontakt</h2>
            <p>
              Podmínky můžeme kdykoli upravit; aktuální verze je vždy na této stránce. Při závažných změnách vás
              informujeme. Dotazy směřujte na stránku <Link href="/podpora" className="text-primary hover:underline">Podpora</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
