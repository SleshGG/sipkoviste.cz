'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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
  Loader2,
  CheckCircle2,
  Star,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { sendMessageAction, markMessagesAsReadAction, confirmSaleAction, getSaleStatusAction, submitReviewAction } from '@/lib/supabase/actions'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { isUserOnline } from '@/lib/utils'
import type { MessageWithRelations } from '@/lib/supabase/types'

interface Conversation {
  id: string
  participant: {
    id: string
    name: string | null
    avatar_url: string | null
    show_online_status?: boolean
    last_seen_at?: string | null
  }
  product: {
    id: string
    name: string
    image: string | null
    seller_id?: string
  }
  lastMessage: string
  timestamp: string
  unread: boolean
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  product_id: string
  text: string
  is_read: boolean
  created_at: string
}

function formatTimestamp(date: string) {
  const now = new Date()
  const messageDate = new Date(date)
  const diffMs = now.getTime() - messageDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Právě teď'
  if (diffMins < 60) return `před ${diffMins} min`
  if (diffHours < 24) return `před ${diffHours} hod`
  if (diffDays < 7) return `před ${diffDays} dny`
  return messageDate.toLocaleDateString('cs-CZ')
}

function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [saleStatus, setSaleStatus] = useState<{ confirmed: boolean; canReview: boolean; alreadyReviewed: boolean } | null>(null)
  const [isConfirmingSale, setIsConfirmingSale] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Při změně zpráv nebo konverzace posunout na konec (poslední zprávy)
  useEffect(() => {
    if (!selectedConversation || messages.length === 0) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation, messages])

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user and fetch conversations
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      setCurrentUserId(user.id)
      
      // Fetch conversations
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            name,
            avatar_url,
            show_online_status,
            last_seen_at
          ),
          receiver:profiles!messages_receiver_id_fkey (
            id,
            name,
            avatar_url,
            show_online_status,
            last_seen_at
          ),
          product:products!messages_product_id_fkey (
            id,
            name,
            image,
            seller_id
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        setConversations([])
        setIsLoading(false)
        return
      }

      // Group by conversation
      const conversationsMap = new Map<string, Conversation>()
      
      messagesData?.forEach((msg: MessageWithRelations) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
        const key = `${otherUserId}::${msg.product_id}`
        
        if (!conversationsMap.has(key)) {
          conversationsMap.set(key, {
            id: key,
            participant: otherUser,
            product: msg.product,
            lastMessage: msg.text,
            timestamp: msg.created_at,
            unread: !msg.is_read && msg.receiver_id === user.id
          })
        }
      })

      const list = Array.from(conversationsMap.values())
      setConversations(list)
      // Na desktopu hned zobrazit chat s posledním uživatelem; na mobilu až po kliknutí
      if (list.length > 0 && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
        setSelectedConversation(list[0].id)
      }
      setIsLoading(false)
    })
  }, [])

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return

    const [otherUserId, productId] = selectedConversation.split('::')
    const supabase = createClient()

    const fetchMessages = async () => {
      // Dva jednoduché dotazy místo složitého .or() – spolehlivě vrátí obousměrné zprávy
      const [sent, received] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('product_id', productId)
          .eq('sender_id', currentUserId)
          .eq('receiver_id', otherUserId)
          .order('created_at', { ascending: true }),
        supabase
          .from('messages')
          .select('*')
          .eq('product_id', productId)
          .eq('sender_id', otherUserId)
          .eq('receiver_id', currentUserId)
          .order('created_at', { ascending: true }),
      ])

      const sentData = sent.data ?? []
      const receivedData = received.data ?? []
      const merged = [...sentData, ...receivedData].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(merged)
      if (!sent.error && !received.error) {
        markMessagesAsReadAction(otherUserId, productId)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `product_id=eq.${productId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUserId])

  // Stav prodeje a hodnocení pro vybranou konverzaci
  useEffect(() => {
    if (!selectedConversation || !currentUserId) {
      setSaleStatus(null)
      return
    }
    const conv = conversations.find((c) => c.id === selectedConversation)
    const productId = conv?.product?.id
    const otherUserId = conv?.participant?.id
    const productSellerId = conv?.product?.seller_id
    if (!productId || !otherUserId || !productSellerId) {
      setSaleStatus(null)
      return
    }
    let cancelled = false
    const run = () => {
      getSaleStatusAction(productId, otherUserId, productSellerId).then((res) => {
        if (cancelled || res.error) {
          if (!cancelled) setSaleStatus(null)
          return
        }
        setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed })
      })
    }
    run()
    const t = setTimeout(run, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [selectedConversation, currentUserId, conversations])

  const handleConfirmSale = async () => {
    if (!selectedConv || !currentUserId || !selectedConv.product.seller_id) return
    setIsConfirmingSale(true)
    const err = await confirmSaleAction(selectedConv.product.id, selectedConv.participant.id, selectedConv.product.seller_id)
    setIsConfirmingSale(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    getSaleStatusAction(selectedConv.product.id, selectedConv.participant.id, selectedConv.product.seller_id).then((res) => {
      if (!res.error) setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed })
    })
  }

  const handleSubmitReview = async () => {
    if (!selectedConv || reviewRating < 1 || reviewRating > 5) return
    setIsSubmittingReview(true)
    const err = await submitReviewAction({
      product_id: selectedConv.product.id,
      profile_id: selectedConv.participant.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    })
    setIsSubmittingReview(false)
    if (err?.error) {
      alert(err.error)
      return
    }
    setReviewDialogOpen(false)
    setReviewRating(0)
    setReviewComment('')
    setSaleStatus((prev) => (prev ? { ...prev, canReview: false, alreadyReviewed: true } : null))
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !currentUserId) return

    setIsSending(true)
    const [otherUserId, productId] = selectedConversation!.split('::')

    const result = await sendMessageAction({
      receiver_id: otherUserId,
      product_id: productId,
      text: newMessage.trim(),
    })

    setIsSending(false)

    if (!result.error) {
      setNewMessage('')
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Přihlaste se pro zobrazení zpráv</h2>
          <p className="text-muted-foreground">Pro přístup ke zprávám se musíte nejprve přihlásit</p>
        </main>
        <MobileNav />
      </div>
    )
  }

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
            {conversations.filter((c) => c.unread).length} nepřečtených zpráv
          </p>
        </motion.div>

        {/* Messages Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-border bg-card overflow-hidden rounded-none sm:rounded-lg py-0">
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
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv, idx) => (
                      <button
                        key={`conv-${conv.id}-${idx}`}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-3 sm:p-4 text-left border-b border-border hover:bg-secondary/50 transition-colors ${
                          selectedConversation === conv.id
                            ? 'bg-secondary/80 border-l-2 border-l-primary'
                            : ''
                        }`}
                      >
                        <div className="flex gap-2.5 sm:gap-3">
                          <div className="relative shrink-0 overflow-visible">
                            <AvatarWithOnline
                              src={conv.participant.avatar_url ?? '/placeholder.svg'}
                              alt={conv.participant.name || 'User'}
                              size="md"
                              isOnline={isUserOnline(conv.participant.show_online_status, conv.participant.last_seen_at)}
                            />
                            {conv.unread && (
                              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-primary border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-medium text-sm sm:text-base truncate ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {conv.participant.name || 'Uživatel'}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                {formatTimestamp(conv.timestamp)}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-primary/80 truncate mt-0.5">
                              {conv.product.name}
                            </p>
                            <p
                              className={`text-xs sm:text-sm truncate mt-1 ${conv.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                            >
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-8">
                      <div>
                        <p className="text-muted-foreground">Žádné konverzace</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Chat Area */}
              <div
                className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}
              >
                {selectedConv ? (
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
                        <AvatarWithOnline
                          src={selectedConv.participant.avatar_url ?? '/placeholder.svg'}
                          alt={selectedConv.participant.name || 'User'}
                          size="sm"
                          isOnline={false}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {selectedConv.participant.name || 'Uživatel'}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {selectedConv.product.name}
                          </p>
                        </div>
                        <Link href={`/product/${selectedConv.product.id}`} className="shrink-0 hidden xs:block">
                          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary transition-colors">
                            {selectedConv.product.image && (
                              <Image
                                src={selectedConv.product.image}
                                alt={selectedConv.product.name}
                                fill
                                className="object-cover"
                              />
                            )}
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
                              Nahlasit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Smazat konverzaci
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Potvrzení prodeje (jen prodejce) a hodnocení (oba účastníci) */}
                    {selectedConv.product.seller_id && saleStatus && (
                      <div className="px-3 sm:px-4 py-2 border-b border-border bg-muted/30 flex flex-wrap items-center gap-2">
                        {!saleStatus.confirmed && currentUserId === selectedConv.product.seller_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleConfirmSale}
                            disabled={isConfirmingSale}
                          >
                            {isConfirmingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Potvrdit prodej
                          </Button>
                        )}
                        {saleStatus.confirmed && saleStatus.canReview && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setReviewDialogOpen(true)}>
                            <Star className="h-4 w-4" />
                            {currentUserId === selectedConv.product.seller_id ? 'Ohodnotit kupujícího' : 'Ohodnotit prodejce'}
                          </Button>
                        )}
                        {saleStatus.confirmed && saleStatus.alreadyReviewed && (
                          <span className="text-sm text-muted-foreground">
                            {currentUserId === selectedConv.product.seller_id ? 'Kupujícího jste již ohodnotil/a' : 'Prodejce jste již ohodnotil/a'}
                          </span>
                        )}
                        {saleStatus.confirmed && currentUserId === selectedConv.product.seller_id && !saleStatus.canReview && !saleStatus.alreadyReviewed && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Prodej potvrzen
                          </span>
                        )}
                      </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-background/50">
                      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 sm:gap-3 ${msg.sender_id === currentUserId ? 'justify-end' : ''}`}
                          >
                            {msg.sender_id !== currentUserId && (
                              <AvatarWithOnline
                                src={selectedConv.participant.avatar_url ?? '/placeholder.svg'}
                                alt=""
                                size="xs"
                                isOnline={false}
                              />
                            )}
                            <div className={`space-y-1 max-w-[80%] sm:max-w-[75%] ${msg.sender_id === currentUserId ? 'items-end' : ''}`}>
                              <div
                                className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                                  msg.sender_id === currentUserId
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-secondary rounded-tl-sm'
                                }`}
                              >
                                <p className="text-xs sm:text-sm">{msg.text}</p>
                              </div>
                              <span className={`text-[10px] sm:text-xs text-muted-foreground ${msg.sender_id === currentUserId ? 'mr-2 text-right block' : 'ml-2'}`}>
                                {formatTimestamp(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
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
                            if (e.key === 'Enter' && newMessage.trim() && !isSending) {
                              handleSendMessage()
                            }
                          }}
                          className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm"
                        />
                        <Button 
                          size="icon" 
                          disabled={!newMessage.trim() || isSending} 
                          className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                          onClick={handleSendMessage}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Dialog pro hodnocení druhého účastníka */}
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {currentUserId === selectedConv.product.seller_id ? 'Ohodnotit kupujícího' : 'Ohodnotit prodejce'}
                          </DialogTitle>
                          <DialogDescription>
                            Jaká byla spokojenost s {currentUserId === selectedConv.product.seller_id ? 'kupujícím' : 'prodejcem'} {selectedConv.participant.name || 'Uživatel'} u inzerátu {selectedConv.product.name}?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="flex gap-1 justify-center">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setReviewRating(n)}
                                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <Star
                                  className={`h-8 w-8 ${reviewRating >= n ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                                />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Volitelný komentář..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            Zrušit
                          </Button>
                          <Button onClick={handleSubmitReview} disabled={reviewRating < 1 || isSubmittingReview}>
                            {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Odeslat hodnocení
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
