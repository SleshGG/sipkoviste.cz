import Link from 'next/link'
import { Target } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Mobil: logo → práva → odkazy pod sebou; desktop: logo+práva vlevo, odkazy vpravo */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-2 text-center md:text-left w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Šipkoviště.cz</span>
            </div>
            <span className="text-muted-foreground text-sm">
              2026 Všechna práva vyhrazena
            </span>
          </div>
          <nav className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-sm text-muted-foreground">
            <Link href="/podminky" className="hover:text-foreground transition-colors">
              Obchodní podmínky
            </Link>
            <Link href="/soukromi" className="hover:text-foreground transition-colors">
              Soukromí
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
            <Link href="/podpora" className="hover:text-foreground transition-colors">
              Podpora
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
