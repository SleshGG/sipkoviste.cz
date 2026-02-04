'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MessageCircle, Send, ChevronLeft, Search, MoreVertical, Trash2, Archive, Flag } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { mockProducts } from '@/lib/data'

function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl font-bold mb-4">Zprávy</h1>
        <Card className="border-border bg-card overflow-hidden">
          <div className="flex h-[500px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>Zatím zde nemáte žádné zprávy.</p>
            </div>
          </div>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MessagesContent />
    </Suspense>
  )
}