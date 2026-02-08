import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ochrana soukromí',
  description: 'Zásady ochrany osobních údajů a cookies na Šipkoviště.cz.',
}

export default function SoukromiPage() {
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
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Ochrana soukromí</h1>
        <p className="text-sm text-muted-foreground mb-8">Poslední aktualizace: únor 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Správce údajů</h2>
            <p>
              Správcem osobních údajů v rámci platformy Šipkoviště.cz je provozovatel platformy. Kontakt naleznete
              na stránce <Link href="/podpora" className="text-primary hover:underline">Podpora</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Jaké údaje zpracováváme</h2>
            <p>
              Zpracováváme údaje nezbytné pro registraci a užívání služby: e-mail, jméno (zobrazené v profilu),
              údaje z inzerátů (název, popis, cena, fotografie), zprávy mezi uživateli a údaje o hodnoceních.
              Technické údaje (IP adresa, typ prohlížeče) mohou být zpracovány pro provoz a bezpečnost služby.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Účel a právní základ</h2>
            <p>
              Údaje zpracováváme za účelem poskytování platformy, komunikace mezi uživateli, zlepšování služeb
              a plnění právních povinností. Právním základem je plnění smlouvy, oprávněný zájem a v nezbytných
              případech váš souhlas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Sdílení a uchování</h2>
            <p>
              Osobní údaje mohou být předány subjektům zajišťujícím hosting, autentizaci a analýzu (včetně
              služeb v EU). Uchováváme je po dobu trvání účtu a v zákonem stanovené lhůtě po jeho zrušení.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Vaše práva</h2>
            <p>
              Máte právo na přístup k údajům, jejich opravu, výmaz, omezení zpracování a v určitých případech
              na přenositelnost a námitku. Pro uplatnění práv nebo podání stížnosti u dozorového úřadu nás
              kontaktujte přes <Link href="/podpora" className="text-primary hover:underline">Podporu</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Cookies</h2>
            <p>
              Platforma používá technicky nezbytné cookies pro přihlášení a funkčnost. Volitelně mohou být
              použity analytické nástroje. Souhlas s volitelnými cookies lze kdykoli změnit v nastavení
              prohlížeče.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
