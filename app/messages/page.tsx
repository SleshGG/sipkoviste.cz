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
import {
  MessageCircle,
  Send,
  ChevronLeft,
  Search,
  MoreVertical,
  Trash2,
  Archive,
  Flag,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// mockMessages byl odstraněn, protože v lib/data.ts již neexistuje
import { mockProducts } from '@/lib/data'

function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  // Nastaveno na prázdné pole, dokud nepropojíme zprávy se Supabase
  const [messages] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMessages = messages.filter(
    (msg) =>
      msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedMessage = selectedConversation
    ? messages.find((m) => m.id === selectedConversation)
    : null

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 sm:mb-6 px-2 sm:px-0"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">Zprávy</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {messages.filter((m) => m.unread).length} nepřečtených zpráv
          </p>
        </motion.div>

        {/* Messages Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-border bg-card overflow-hidden rounded-none sm:rounded-lg">
            <div className="flex h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] min-h-[450px] sm:min-h-[550px]">
              {/* Left Sidebar - Contacts List */}
              <div
                className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}
              >
                {/* Search */}
                <div className="p-3 sm:p-4 border-b border-border shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hledat v konverzacích..."
                      className="pl-10 bg-secondary border-0 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setSelectedConversation(msg.id)}
                        className={`w-full p-3 sm:p-4 text-left border-b border-border hover:bg-secondary/50 transition-colors ${selectedConversation === msg.id
                            ? 'bg-secondary/80 border-l-2 border-l-primary'
                            : ''
                          }`}
                      >
                        <div className="flex gap-2.5 sm:gap-3">
                          <div className="relative shrink-0">
                            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-secondary">
                              <Image
                                src={msg.senderAvatar || '/placeholder.svg'}
                                alt={msg.senderName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {msg.unread && (
                              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-primary border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-medium text-sm sm:text-base truncate ${msg.unread ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {msg.senderName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                {msg.timestamp}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-primary/80 truncate mt-0.5">
                              {msg.productName}
                            </p>
                            <p
                              className={`text-xs sm:text-sm truncate mt-1 ${msg.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                            >
                              {msg.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-8">
                      <div>
                        <p className="text-muted-foreground text-sm">Zatím nemáte žádné zprávy.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Chat Area */}
              <div
                className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}
              >
                {selectedMessage ? (
                  <>
                    {/*