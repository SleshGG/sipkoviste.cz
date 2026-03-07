import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nastavení účtu',
  description: 'Správa profilu, inzerátů a nastavení účtu na Šipkoviště.cz.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
