import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moje inzeráty',
  description: 'Přehled a správa vašich inzerátů na Šipkoviště.cz.',
}

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
