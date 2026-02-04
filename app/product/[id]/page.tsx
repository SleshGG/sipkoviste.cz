import { mockProducts } from '@/lib/data'
import { ProductPageClient } from './product-page-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = mockProducts.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Produkt nenalezen</h1>
          <p className="text-muted-foreground mb-4">Tento inzerát byl možná odstraněn</p>
          <Link href="/marketplace">
            <Button>Zpět na tržiště</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ProductPageClient product={product} />
}
