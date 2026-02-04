'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, MessageCircle, Heart, Settings, Plus, MoreVertical, ExternalLink } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { mockProducts } from '@/lib/data'

function DashboardContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'listings'
  const [listings] = useState(mockProducts)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Můj Dashboard</h1>
          <Button asChild><Link href="/sell"><Plus className="mr-2 h-4 w-4" /> Nový inzerát</Link></Button>
        </div>
        <Tabs defaultValue={tab}>
          <TabsList className="mb-6"><TabsTrigger value="listings">Moje inzeráty</TabsTrigger></TabsList>
          <TabsContent value="listings">
            <div className="grid gap-4">
              {listings.map((item) => (
                <Card key={item.id} className="p-4 flex gap-4 items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded bg-secondary">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="font-bold text-primary">{item.price} Kč</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <MobileNav />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardContent />
    </Suspense>
  )
}