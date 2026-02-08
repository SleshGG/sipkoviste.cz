import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Zprávy',
  description: 'Konverzace s prodejci a kupující na Šipkoviště.cz.',
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
