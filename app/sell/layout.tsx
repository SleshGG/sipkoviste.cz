import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Přidat inzerát',
  description: 'Vystavte inzerát na prodej šipek, terče nebo příslušenství na Šipkoviště.cz.',
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
