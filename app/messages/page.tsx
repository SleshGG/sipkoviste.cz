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
import { mockMessages } from '@/lib/data'

function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages] = useState(mockMessages)
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
                        className={`w-full p-3 sm:p-4 text-left border-b border-border hover:bg-secondary/50 transition-colors ${
                          selectedConversation === msg.id
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
                        <p className="text-muted-foreground">Žádné konverzace nenalezeny</p>
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
                    {/* Chat Header */}
                    <div className="p-3 sm:p-4 border-b border-border shrink-0 bg-secondary/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="md:hidden p-1.5 sm:p-2 -ml-1 hover:bg-secondary rounded-lg shrink-0"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-secondary shrink-0">
                          <Image
                            src={selectedMessage.senderAvatar || '/placeholder.svg'}
                            alt={selectedMessage.senderName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{selectedMessage.senderName}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {selectedMessage.productName}
                          </p>
                        </div>
                        <Link href={`/product/${selectedMessage.productId}`} className="shrink-0 hidden xs:block">
                          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary transition-colors">
                            <Image
                              src={selectedMessage.productImage || '/placeholder.svg'}
                              alt={selectedMessage.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Archive className="h-4 w-4" />
                              Archivovat
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Flag className="h-4 w-4" />
                              Nahlásit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Smazat konverzaci
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-background/50">
                      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                        {/* Date Separator */}
                        <div className="flex items-center gap-3 sm:gap-4 my-3 sm:my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground px-2">Dnes</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Incoming Message */}
                        <div className="flex gap-2 sm:gap-3">
                          <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-secondary shrink-0">
                            <Image
                              src={selectedMessage.senderAvatar || '/placeholder.svg'}
                              alt={selectedMessage.senderName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-1 max-w-[80%] sm:max-w-[75%]">
                            <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-2.5">
                              <p className="text-xs sm:text-sm">{selectedMessage.lastMessage}</p>
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">
                              {selectedMessage.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Outgoing Message Example */}
                        <div className="flex gap-2 sm:gap-3 justify-end">
                          <div className="space-y-1 max-w-[80%] sm:max-w-[75%]">
                            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-2.5">
                              <p className="text-xs sm:text-sm">
                                Dobrý den, děkuji za zájem! Ano, šipky jsou stále dostupné.
                              </p>
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mr-2 text-right block">
                              Před 5 minutami
                            </span>
                          </div>
                        </div>

                        {/* Another Incoming Message */}
                        <div className="flex gap-2 sm:gap-3">
                          <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-secondary shrink-0">
                            <Image
                              src={selectedMessage.senderAvatar || '/placeholder.svg'}
                              alt={selectedMessage.senderName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-1 max-w-[80%] sm:max-w-[75%]">
                            <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-2.5">
                              <p className="text-xs sm:text-sm">
                                Super! Bylo by možné se domluvit na osobním předání v Praze?
                              </p>
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">Právě teď</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-2 sm:p-4 border-t border-border shrink-0 bg-card">
                      <div className="flex gap-2 sm:gap-3 max-w-3xl mx-auto">
                        <Input
                          placeholder="Napište zprávu..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newMessage.trim()) {
                              setNewMessage('')
                            }
                          }}
                          className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm"
                        />
                        <Button size="icon" disabled={!newMessage.trim()} className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8 bg-background/50">
                    <div>
                      <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Vyberte konverzaci</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Vyberte konverzaci ze seznamu vlevo pro zobrazení zpráv
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
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
