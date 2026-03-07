'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Trash2,
  Archive,
  Loader2,
  CheckCircle2,
  Star,
  Bell,
  Check,
  X,
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
import {
  sendMessageAction,
  markMessagesAsReadAction,
  getSaleStatusAction,
  submitReviewAction,
  acceptOfferAction,
  rejectOfferAction,
  sendCounterOfferAction,
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  confirmSaleAction,
  cancelReservationAction,
} from '@/lib/supabase/actions'
import { AvatarWithOnline } from '@/components/avatar-with-online'
import { isUserOnline } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { MessageWithRelations, Notification } from '@/lib/supabase/types'

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
    deleted?: boolean
  } | null
  lastMessage: string
  timestamp: string
  unread: boolean
  unreadCount: number
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  product_id: string | null
  text: string
  is_read: boolean
  message_type?: 'question' | 'buy' | 'offer' | null
  offer_amount?: number | null
  offer_status?: 'pending' | 'accepted' | 'rejected' | null
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const toUserId = searchParams.get('to')
  const productIdFromUrl = searchParams.get('product')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [saleStatus, setSaleStatus] = useState<{ confirmed: boolean; canReview: boolean; alreadyReviewed: boolean; productSoldToOther?: boolean } | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null)
  const [counterOfferDialogOpen, setCounterOfferDialogOpen] = useState(false)
  const [counterOfferMessageId, setCounterOfferMessageId] = useState<string | null>(null)
  const [counterOfferAmount, setCounterOfferAmount] = useState('')
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'zpravy' | 'upozorneni'>(tabParam === 'upozorneni' ? 'upozorneni' : 'zpravy')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [confirmingProductId, setConfirmingProductId] = useState<string | null>(null)
  const [cancelingProductId, setCancelingProductId] = useState<string | null>(null)
  const [cancelReservationDialog, setCancelReservationDialog] = useState<{ productId: string; productName: string } | null>(null)
  const selectedConversationRef = useRef<string | null>(null)
  const conversationsRef = useRef<Conversation[]>([])
  selectedConversationRef.current = selectedConversation
  conversationsRef.current = conversations

  // Při změně zpráv nebo konverzace posunout na konec (poslední zprávy)
  useEffect(() => {
    if (!selectedConversation || messages.length === 0) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation, messages])

  useEffect(() => {
    if (searchParams.get('tab') === 'upozorneni') setActiveTab('upozorneni')
    else if (searchParams.get('to') && searchParams.get('product')) setActiveTab('zpravy')
  }, [searchParams])

  // Otevřít dialog hodnocení při navigaci s ?openReview=1
  const openReviewHandledRef = useRef(false)

  const notificationsRef = useRef<Notification[]>([])
  notificationsRef.current = notifications

  useEffect(() => {
    if (!currentUserId) return
    if (activeTab === 'upozorneni' && notificationsRef.current.length === 0) {
      setNotificationsLoading(true)
    }
    getNotificationsAction().then(({ notifications: n }) => {
      setNotifications(n ?? [])
      setNotificationsLoading(false)
    })
  }, [activeTab, currentUserId])

  // Při zobrazení záložky upozornění označit všechna jako přečtená a zmizí badge
  useEffect(() => {
    if (!currentUserId || activeTab !== 'upozorneni') return
    markAllNotificationsAsReadAction().then(({ error }) => {
      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    })
  }, [activeTab, currentUserId])

  useEffect(() => {
    if (!currentUserId) return
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` }, () => {
        getNotificationsAction().then(({ notifications: list }) => setNotifications(list ?? []))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  useEffect(() => {
    let cancelled = false
    if (toUserId && productIdFromUrl) {
      setSelectedConversation(`${toUserId}::${productIdFromUrl}`)
    }
    const supabase = createClient()
    
    // Get current user and fetch conversations
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (!cancelled) setIsLoading(false)
        return
      }
      
      if (!cancelled) setCurrentUserId(user.id)
      
      // Načíst upozornění paralelně s konverzacemi
      getNotificationsAction().then(({ notifications: n }) => { if (!cancelled) setNotifications(n ?? []) })
      
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
        if (!cancelled) { setConversations([]); setIsLoading(false) }
        return
      }

      // Group by conversation
      const conversationsMap = new Map<string, Conversation>()
      
      try {
      (messagesData ?? []).forEach((msg: MessageWithRelations) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
        if (!otherUser) return
        const product = msg.product
        const convProductId = msg.product_id ?? msg.deleted_product_id ?? null
        const key = convProductId ? `${otherUserId}::${convProductId}` : `${otherUserId}::general`
        const productForConv = product
          ? { id: product.id, name: product.name, image: product.image ?? null, seller_id: product.seller_id }
          : msg.deleted_product_id && msg.deleted_product_name
            ? { id: msg.deleted_product_id, name: msg.deleted_product_name, image: null, deleted: true as const }
            : null

        const isUnread = !msg.is_read && msg.receiver_id === user.id
        if (!conversationsMap.has(key)) {
          conversationsMap.set(key, {
            id: key,
            participant: { id: otherUser.id, name: otherUser.name ?? null, avatar_url: otherUser.avatar_url ?? null, show_online_status: 'show_online_status' in otherUser ? otherUser.show_online_status : undefined, last_seen_at: 'last_seen_at' in otherUser ? otherUser.last_seen_at : undefined },
            product: productForConv,
            lastMessage: msg.text,
            timestamp: msg.created_at,
            unread: isUnread,
            unreadCount: isUnread ? 1 : 0
          })
        } else {
          const conv = conversationsMap.get(key)!
          if (isUnread) {
            conv.unreadCount++
            conv.unread = true
          }
        }
      })
      } catch (err) {
        console.error('Error processing conversations:', err)
        if (!cancelled) { setConversations([]); setIsLoading(false) }
        return
      }

      if (cancelled) return
      let list = Array.from(conversationsMap.values()).map(c => ({
        ...c,
        unread: c.unreadCount > 0,
      }))
      const productConvKey = toUserId && productIdFromUrl ? `${toUserId}::${productIdFromUrl}` : null
      const generalWithTo = toUserId ? list.find((c) => c.id === `${toUserId}::general`) : null
      const productConv = productConvKey ? list.find((c) => c.id === productConvKey) : null

      if (productConv) {
        setSelectedConversation(productConv.id)
      } else if (productConvKey && toUserId && productIdFromUrl) {
        const [{ data: profile }, { data: product }] = await Promise.all([
          supabase.from('profiles').select('id, name, avatar_url, show_online_status, last_seen_at').eq('id', toUserId).single(),
          supabase.from('products').select('id, name, image, seller_id').eq('id', productIdFromUrl).single(),
        ])
        if (profile && profile.id !== user.id) {
          const virtualProductConv: Conversation = {
            id: productConvKey,
            participant: { id: profile.id, name: profile.name ?? null, avatar_url: profile.avatar_url ?? null, show_online_status: (profile as { show_online_status?: boolean }).show_online_status, last_seen_at: (profile as { last_seen_at?: string | null }).last_seen_at },
            product: product ? { id: product.id, name: product.name, image: product.image ?? null, seller_id: product.seller_id } : null,
            lastMessage: '',
            timestamp: new Date().toISOString(),
            unread: false,
            unreadCount: 0,
          }
          list = [virtualProductConv, ...list]
          setSelectedConversation(productConvKey)
        }
      } else if (toUserId && !productIdFromUrl && !generalWithTo) {
        const { data: profile } = await supabase.from('profiles').select('id, name, avatar_url').eq('id', toUserId).single()
        if (profile && profile.id !== user.id) {
          const virtualConv: Conversation = {
            id: `${toUserId}::general`,
            participant: { id: profile.id, name: profile.name ?? null, avatar_url: profile.avatar_url ?? null },
            product: null,
            lastMessage: '',
            timestamp: new Date().toISOString(),
            unread: false,
            unreadCount: 0,
          }
          list = [virtualConv, ...list]
          setSelectedConversation(virtualConv.id)
        }
      } else if (generalWithTo && !productIdFromUrl) {
        setSelectedConversation(generalWithTo.id)
      } else if (list.length > 0 && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
        setSelectedConversation(list[0].id)
      }
      if (!cancelled) {
        setConversations(list)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [toUserId, productIdFromUrl])

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  // Otevřít dialog hodnocení při navigaci s ?openReview=1
  useEffect(() => {
    if (searchParams.get('openReview') !== '1' || openReviewHandledRef.current) return
    const conv = conversations.find((c) => c.id === selectedConversation)
    if (saleStatus?.canReview && conv?.product && conv?.participant) {
      openReviewHandledRef.current = true
      setReviewDialogOpen(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('openReview')
      router.replace(`/messages${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
    }
  }, [searchParams, saleStatus, selectedConversation, conversations, router])

  // Globální Realtime odběr – všechny zprávy, kde jsme příjemce (zobrazí se protistraně hned, nepřečtené dokud neklikne)
  useEffect(() => {
    if (!currentUserId) return
    const supabase = createClient()

    const handleIncomingMessage = async (newMsg: Message & { deleted_product_id?: string | null; deleted_product_name?: string | null }) => {
      const otherUserId = newMsg.sender_id
      const convProductId = newMsg.product_id ?? newMsg.deleted_product_id ?? null
      const convKey = convProductId ? `${otherUserId}::${convProductId}` : `${otherUserId}::general`
      const isViewingThisConv = selectedConversationRef.current === convKey

      const existing = conversationsRef.current.find(c => c.id === convKey)
      if (existing) {
        setConversations(prev =>
          prev.map(c =>
            c.id === convKey
              ? {
                  ...c,
                  lastMessage: newMsg.text,
                  timestamp: newMsg.created_at,
                  unread: !isViewingThisConv,
                  unreadCount: isViewingThisConv ? 0 : c.unreadCount + 1,
                }
              : c
          )
        )
      }

      if (!isViewingThisConv) {
        const { data: profile } = await supabase.from('profiles').select('id, name, avatar_url').eq('id', otherUserId).single()
        let productInfo: Conversation['product'] = null
        if (convProductId && convProductId !== 'general') {
          const { data: prod } = await supabase.from('products').select('id, name, image, seller_id').eq('id', convProductId).single()
          if (prod) productInfo = { id: prod.id, name: prod.name, image: prod.image ?? null, seller_id: prod.seller_id }
          else if (newMsg.deleted_product_id && (newMsg as { deleted_product_name?: string }).deleted_product_name) {
            productInfo = { id: newMsg.deleted_product_id, name: (newMsg as { deleted_product_name?: string }).deleted_product_name ?? 'Smazaný inzerát', image: null, deleted: true }
          }
        }
        const newConv: Conversation = {
          id: convKey,
          participant: { id: otherUserId, name: profile?.name ?? null, avatar_url: profile?.avatar_url ?? null },
          product: productInfo,
          lastMessage: newMsg.text,
          timestamp: newMsg.created_at,
          unread: true,
          unreadCount: 1,
        }
        setConversations(prev => [newConv, ...prev.filter(c => c.id !== convKey)])
      }

      if (isViewingThisConv) {
        setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]))
        setConversations(prev => prev.map(c => (c.id === convKey ? { ...c, unread: false, unreadCount: 0 } : c)))
        await markMessagesAsReadAction(otherUserId, convProductId)
      }
    }

    const handleMessageUpdate = (updatedMsg: Message & { deleted_product_id?: string | null }) => {
      const otherUserId = updatedMsg.sender_id === currentUserId ? updatedMsg.receiver_id : updatedMsg.sender_id
      const convProductId = updatedMsg.product_id ?? updatedMsg.deleted_product_id ?? null
      const convKey = convProductId ? `${otherUserId}::${convProductId}` : `${otherUserId}::general`
      if (selectedConversationRef.current === convKey) {
        setMessages(prev => prev.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)))
        const prodId = updatedMsg.product_id ?? updatedMsg.deleted_product_id
        if (updatedMsg.offer_status === 'accepted' && prodId) {
          const conv = conversationsRef.current.find(c => c.id === convKey)
          if (conv?.product?.seller_id) {
            getSaleStatusAction(prodId, otherUserId, conv.product.seller_id).then((res) => {
              if (!res.error) setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed, productSoldToOther: res.productSoldToOther })
            })
          }
        }
      }
    }

    const channel = supabase
      .channel('messages-incoming')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` }, (p) =>
        handleIncomingMessage(p.new as Message & { deleted_product_id?: string | null; deleted_product_name?: string | null })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` }, (p) =>
        handleMessageUpdate(p.new as Message & { deleted_product_id?: string | null })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUserId}` }, (p) =>
        handleMessageUpdate(p.new as Message & { deleted_product_id?: string | null })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return

    const [otherUserId, productId] = selectedConversation.split('::')
    const supabase = createClient()

    const isGeneral = productId === 'general'
    const productFilter = isGeneral ? null : productId

    const fetchMessages = async () => {
      let sent, received
      if (isGeneral) {
        [sent, received] = await Promise.all([
          supabase
            .from('messages')
            .select('*')
            .is('product_id', null)
            .is('deleted_product_id', null)
            .eq('sender_id', currentUserId)
            .eq('receiver_id', otherUserId)
            .order('created_at', { ascending: true }),
          supabase
            .from('messages')
            .select('*')
            .is('product_id', null)
            .is('deleted_product_id', null)
            .eq('sender_id', otherUserId)
            .eq('receiver_id', currentUserId)
            .order('created_at', { ascending: true }),
        ])
      } else {
        [sent, received] = await Promise.all([
          supabase
            .from('messages')
            .select('*')
            .or(`product_id.eq.${productId},deleted_product_id.eq.${productId}`)
            .eq('sender_id', currentUserId)
            .eq('receiver_id', otherUserId)
            .order('created_at', { ascending: true }),
          supabase
            .from('messages')
            .select('*')
            .or(`product_id.eq.${productId},deleted_product_id.eq.${productId}`)
            .eq('sender_id', otherUserId)
            .eq('receiver_id', currentUserId)
            .order('created_at', { ascending: true }),
        ])
      }

      const sentData = sent.data ?? []
      const receivedData = received.data ?? []
      const merged = [...sentData, ...receivedData].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(merged)
      if (!sent.error && !received.error) {
        markMessagesAsReadAction(otherUserId, isGeneral ? null : productId)
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation ? { ...c, unread: false, unreadCount: 0 } : c
        ))
      }
    }

    fetchMessages()

    const handleUpdatedMessage = (updatedMsg: Message & { deleted_product_id?: string | null }) => {
      const inConversation = updatedMsg.sender_id === currentUserId
        ? updatedMsg.receiver_id === otherUserId
        : updatedMsg.sender_id === otherUserId
      const matchesConv = isGeneral
        ? (updatedMsg.product_id === null && updatedMsg.deleted_product_id === null)
        : (updatedMsg.product_id === productId || updatedMsg.deleted_product_id === productId)
      if (inConversation && matchesConv) {
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        const prodId = updatedMsg.product_id ?? updatedMsg.deleted_product_id
        if (updatedMsg.offer_status === 'accepted' && prodId && selectedConv?.product?.seller_id) {
          getSaleStatusAction(prodId, otherUserId, selectedConv.product.seller_id).then((res) => {
            if (!res.error) setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed, productSoldToOther: res.productSoldToOther })
          })
        }
      }
    }

    // Odběr UPDATE pro vybranou konverzaci (nabídky – přijetí/odmítnutí) – INSERT řeší globální odběr
    const channel = supabase.channel('messages-selected')
    if (isGeneral) {
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'product_id=is.null' }, (p) => handleUpdatedMessage(p.new as Message & { deleted_product_id?: string | null }))
    } else {
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `product_id=eq.${productId}` }, (p) => handleUpdatedMessage(p.new as Message & { deleted_product_id?: string | null }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `deleted_product_id=eq.${productId}` }, (p) => handleUpdatedMessage(p.new as Message & { deleted_product_id?: string | null }))
    }
    channel.subscribe()

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
        setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed, productSoldToOther: res.productSoldToOther })
      })
    }
    run()
    const t = setTimeout(run, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [selectedConversation, currentUserId, conversations])

  const handleSubmitReview = async () => {
    if (!selectedConv || !selectedConv.product || reviewRating < 1 || reviewRating > 5) return
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

  const handleAcceptOffer = async (messageId: string) => {
    setProcessingOfferId(messageId)
    const err = await acceptOfferAction(messageId)
    setProcessingOfferId(null)
    if (err?.error) alert(err.error)
    else {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offer_status: 'accepted' as const } : m))
      if (selectedConv?.product?.seller_id) {
        getSaleStatusAction(selectedConv.product.id, selectedConv.participant.id, selectedConv.product.seller_id).then((res) => {
          if (!res.error) setSaleStatus({ confirmed: res.confirmed, canReview: res.canReview, alreadyReviewed: res.alreadyReviewed, productSoldToOther: res.productSoldToOther })
        })
      }
    }
  }

  const handleRejectOffer = async (messageId: string) => {
    setProcessingOfferId(messageId)
    const err = await rejectOfferAction(messageId)
    setProcessingOfferId(null)
    if (err?.error) alert(err.error)
    else {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offer_status: 'rejected' as const } : m))
    }
  }

  const handleOpenCounterOffer = (messageId: string) => {
    setCounterOfferMessageId(messageId)
    setCounterOfferAmount('')
    setCounterOfferDialogOpen(true)
  }

  const handleSubmitCounterOffer = async () => {
    const amount = parseInt(counterOfferAmount.replace(/\s/g, ''), 10)
    if (!counterOfferMessageId || !amount || amount < 1) {
      alert('Zadejte platnou částku.')
      return
    }
    setProcessingOfferId(counterOfferMessageId)
    const result = await sendCounterOfferAction(counterOfferMessageId, amount)
    setProcessingOfferId(null)
    setCounterOfferDialogOpen(false)
    setCounterOfferMessageId(null)
    setCounterOfferAmount('')
    if (result?.error) alert(result.error)
    else if (result?.data) {
      setMessages(prev => prev.map(m => m.id === counterOfferMessageId ? { ...m, offer_status: 'rejected' as const } : m))
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !currentUserId) return

    setIsSending(true)
    const [otherUserId, productId] = selectedConversation!.split('::')
    const isGeneral = productId === 'general'
    const isDeletedProduct = selectedConv.product?.deleted

    const result = await sendMessageAction({
      receiver_id: otherUserId,
      product_id: isGeneral || isDeletedProduct ? null : productId,
      ...(isDeletedProduct && selectedConv.product
        ? { deleted_product_id: productId, deleted_product_name: selectedConv.product.name }
        : {}),
      text: newMessage.trim(),
    })

    setIsSending(false)

    if (!result.error && result.data) {
      setNewMessage('')
      setMessages(prev => [...prev, result.data as Message])
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation 
          ? { ...c, lastMessage: (result.data as Message).text, timestamp: (result.data as Message).created_at }
          : c
      ))
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.product?.name ?? 'Obecná konverzace').toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-xl font-semibold mb-2">Přihlaste se pro zobrazení zpráv</h1>
          <p className="text-muted-foreground">Pro přístup ke zprávám se musíte nejprve přihlásit</p>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="h-screen max-h-[100dvh] flex flex-col overflow-hidden bg-background">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col container mx-auto px-2 sm:px-4 pb-20 md:pb-0">
        {/* Page Header + Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col flex-1 min-h-0 px-2 sm:px-0 py-4 sm:py-4"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Zprávy</h1>
          <h2 className="sr-only">Obsah zpráv</h2>
          <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'zpravy' | 'upozorneni')
              const params = new URLSearchParams(searchParams.toString())
              if (v === 'upozorneni') params.set('tab', 'upozorneni')
              else params.delete('tab')
              const q = params.toString()
              router.replace(`/messages${q ? `?${q}` : ''}`, { scroll: false })
            }} className="flex flex-col flex-1 min-h-0 flex">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-3 sm:mb-4 shrink-0">
              <TabsTrigger value="zpravy" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Zprávy
                {conversations.some(c => c.unread) && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {conversations.filter(c => c.unread).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upozorneni" className="gap-2">
                <Bell className="h-4 w-4" />
                Upozornění
                {notifications.some(n => !n.is_read) && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zpravy" className="mt-0 flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
        {/* Messages Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <Card className="border-border bg-card overflow-hidden rounded-none sm:rounded-lg py-0 flex-1 min-h-0 flex flex-col">
            <div className="flex flex-1 min-h-0">
              {/* Left Sidebar - Contacts List */}
              <div
                className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col min-h-0 shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}
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
                <div className="flex-1 min-h-0 overflow-y-auto">
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
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-medium text-sm sm:text-base truncate ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {conv.participant.name || 'Uživatel'}
                              </span>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  {formatTimestamp(conv.timestamp)}
                                </span>
                                {conv.unread && (
                                  <span className="text-[10px] sm:text-xs text-primary font-medium mt-0.5">nepřečtené</span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-primary/80 truncate mt-0.5">
                              {conv.product?.deleted ? 'Inzerát byl smazán' : (conv.product?.name ?? 'Obecná konverzace')}
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
                className={`flex-1 flex flex-col min-h-0 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}
              >
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 sm:p-4 border-b border-border shrink-0 bg-secondary/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="md:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                          aria-label="Zpět"
                        >
                          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
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
                            {selectedConv.product?.deleted ? 'Inzerát byl smazán' : (selectedConv.product?.name ?? 'Obecná konverzace')}
                          </p>
                        </div>
                        {selectedConv.product && !selectedConv.product.deleted && (
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
                        )}
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
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Smazat konverzaci
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Potvrzení prodeje (jen prodejce) a hodnocení (oba účastníci) */}
                    {selectedConv.product?.seller_id && !selectedConv.product?.deleted && saleStatus && (
                      <div className="px-3 sm:px-4 py-2 border-b border-border bg-muted/30 flex flex-wrap items-center gap-2">
                        {saleStatus.productSoldToOther && currentUserId === selectedConv.product.seller_id && (
                          <span className="text-sm text-muted-foreground">
                            Inzerát byl již prodán jinému kupujícímu
                          </span>
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

                    {/* Messages Area - jediná scrollující oblast */}
                    <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto bg-background/50">
                      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                        {messages.map((msg) => {
                          const isOffer = msg.message_type === 'offer'
                          const isPendingOffer = isOffer && (msg.offer_status === 'pending' || msg.offer_status == null)
                          const canRespondToOffer = isPendingOffer && msg.receiver_id === currentUserId
                          return (
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
                                  <p className="text-xs sm:text-sm">
                                    {msg.text.endsWith(' Šipkobot') ? (
                                      <>
                                        {msg.text.slice(0, -9)}
                                        {' '}
                                        <strong>Šipkobot</strong>
                                      </>
                                    ) : (
                                      msg.text
                                    )}
                                  </p>
                                  {isOffer && msg.offer_status === 'accepted' && (
                                    <p className="text-xs mt-1 opacity-90">✓ Nabídka přijata</p>
                                  )}
                                  {isOffer && msg.offer_status === 'rejected' && (
                                    <p className="text-xs mt-1 opacity-90">Nabídka odmítnuta</p>
                                  )}
                                </div>
                                {canRespondToOffer && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => handleAcceptOffer(msg.id)}
                                      disabled={!!processingOfferId}
                                    >
                                      {processingOfferId === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Přijmout'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => handleOpenCounterOffer(msg.id)}
                                      disabled={!!processingOfferId}
                                    >
                                      Protinabídka
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => handleRejectOffer(msg.id)}
                                      disabled={!!processingOfferId}
                                    >
                                      Odmítnout
                                    </Button>
                                  </div>
                                )}
                                <span className={`text-[10px] sm:text-xs text-muted-foreground ${msg.sender_id === currentUserId ? 'mr-2 text-right block' : 'ml-2'}`}>
                                  {formatTimestamp(msg.created_at)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
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
                          className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary text-base sm:text-sm"
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

                    {/* Dialog pro hodnocení druhého účastníka (jen u konverzací o inzerátu) */}
                    <Dialog open={reviewDialogOpen && !!selectedConv?.product && !selectedConv?.product?.deleted} onOpenChange={setReviewDialogOpen}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {currentUserId === selectedConv?.product?.seller_id ? 'Ohodnotit kupujícího' : 'Ohodnotit prodejce'}
                          </DialogTitle>
                          <DialogDescription>
                            Jaká byla spokojenost s {currentUserId === selectedConv?.product?.seller_id ? 'kupujícím' : 'prodejcem'} {selectedConv?.participant?.name || 'Uživatel'} u inzerátu {selectedConv?.product?.name ?? ''}?
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

                    {/* Dialog pro protinabídku */}
                    <Dialog open={counterOfferDialogOpen} onOpenChange={(open) => { setCounterOfferDialogOpen(open); if (!open) setCounterOfferMessageId(null) }}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Protinabídka</DialogTitle>
                          <DialogDescription>
                            Zadejte částku, kterou jste ochotný akceptovat.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <label htmlFor="counter-amount" className="text-sm font-medium block mb-1.5">Vaše nabídka (Kč)</label>
                            <input
                              id="counter-amount"
                              type="text"
                              inputMode="numeric"
                              placeholder="např. 1 500"
                              value={counterOfferAmount}
                              onChange={(e) => setCounterOfferAmount(e.target.value.replace(/[^\d\s]/g, ''))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCounterOfferDialogOpen(false)}>
                            Zrušit
                          </Button>
                          <Button onClick={handleSubmitCounterOffer} disabled={!counterOfferAmount.trim() || !!processingOfferId}>
                            {processingOfferId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Odeslat protinabídku
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
            </TabsContent>

            <TabsContent value="upozorneni" className="mt-0 flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
              <Card className="border-border bg-card overflow-hidden rounded-none sm:rounded-lg flex-1 min-h-0 flex flex-col">
                {notificationsLoading ? (
                  <div className="flex flex-1 items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16 px-4 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Žádná upozornění</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Jakmile někdo rezervuje váš produkt nebo potvrdí prodej, uvidíte to zde.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border flex-1 min-h-0 overflow-y-auto">
                    {(() => {
                      const byProduct = new Map<string | null, Notification>()
                      for (const n of notifications) {
                        const key = n.product_id ?? `no-product-${n.id}`
                        const existing = byProduct.get(key)
                        if (!existing || new Date(n.created_at).getTime() > new Date(existing.created_at).getTime()) {
                          byProduct.set(key, n)
                        }
                      }
                      return [...byProduct.values()]
                    })()
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((n) => {
                      const chatHref = n.product_id && n.related_user_id ? `/messages?to=${n.related_user_id}&product=${n.product_id}` : n.product_id ? `/product/${n.product_id}` : '/messages'
                      const nWithProduct = n as Notification & { product?: { id: string; name: string; image: string | null; status?: string } | null }
                      const hasReservationButtons = n.type === 'reservation' && n.product_id && n.related_user_id && (nWithProduct.product as { status?: string })?.status === 'reserved'
                      const hasSaleConfirmedButton = n.type === 'sale_confirmed' && n.product_id && n.related_user_id
                      const hasButtons = hasReservationButtons || hasSaleConfirmedButton
                      const markRead = async () => {
                        if (!n.is_read) {
                          await markNotificationAsReadAction(n.id)
                          setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
                        }
                      }
                      const handleConfirmSale = async (e: React.MouseEvent) => {
                        e.stopPropagation()
                        if (!n.product_id) return
                        setConfirmingProductId(n.product_id)
                        const err = await confirmSaleAction(n.product_id)
                        setConfirmingProductId(null)
                        if (err?.error) toast.error(err.error)
                        else {
                          await markRead()
                          getNotificationsAction().then(({ notifications: list }) => setNotifications(list ?? []))
                          setActiveTab('zpravy')
                          if (n.related_user_id && n.product_id) setSelectedConversation(`${n.related_user_id}::${n.product_id}`)
                          router.push(chatHref)
                        }
                      }
                      const handleCancelClick = (e: React.MouseEvent) => {
                        e.stopPropagation()
                        setCancelReservationDialog({ productId: n.product_id!, productName: nWithProduct.product?.name ?? 'produkt' })
                      }
                      return (
                        <div
                          key={n.id}
                          {...(hasButtons ? {
                            role: 'button' as const,
                            tabIndex: 0,
                            onClick: async () => {
                              await markRead()
                              setActiveTab('zpravy')
                              if (n.related_user_id && n.product_id) setSelectedConversation(`${n.related_user_id}::${n.product_id}`)
                              router.push(chatHref)
                            },
                            onKeyDown: async (e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                await markRead()
                                setActiveTab('zpravy')
                                if (n.related_user_id && n.product_id) setSelectedConversation(`${n.related_user_id}::${n.product_id}`)
                                router.push(chatHref)
                              }
                            },
                          } : {
                            onClick: () => markRead(),
                          })}
                          className={`block p-4 sm:p-5 transition-colors border-l-[3px] ${hasButtons ? 'hover:bg-secondary/50 cursor-pointer' : 'cursor-default'} ${!n.is_read ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                        >
                          <div className="flex gap-3">
                            {n.product_id && nWithProduct.product?.image && (
                              <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-secondary">
                                <Image src={nWithProduct.product.image} alt={nWithProduct.product.name} fill className="object-cover" sizes="48px" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                              <div>
                                <p className={`font-medium text-sm sm:text-base ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {n.title}
                                </p>
                                {n.body && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {n.body.split(/(__[^_]*__)/g).map((part, i) =>
                                      part.startsWith('__') && part.endsWith('__') ? (
                                        <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                                      ) : (
                                        part
                                      )
                                    )}
                                  </p>
                                )}
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                                  {formatTimestamp(n.created_at)}
                                </p>
                              </div>
                              {hasReservationButtons && (
                                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button size="sm" className="gap-1.5 !h-8 text-xs shrink-0" onClick={handleConfirmSale} disabled={!!confirmingProductId}>
                                    {confirmingProductId === n.product_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    Potvrdit prodej
                                  </Button>
                                  <Button variant="outline" size="sm" className="gap-1.5 !h-8 text-xs shrink-0" onClick={handleCancelClick} disabled={!!cancelingProductId}>
                                    {cancelingProductId === n.product_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    Zrušit rezervaci
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 !h-8 text-xs shrink-0"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      await markRead()
                                      setActiveTab('zpravy')
                                      setSelectedConversation(`${n.related_user_id}::${n.product_id}`)
                                      router.push(chatHref)
                                    }}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Domluvte si podrobnosti
                                  </Button>
                                </div>
                              )}
                              {hasSaleConfirmedButton && (
                                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Link href={`/messages?to=${n.related_user_id}&product=${n.product_id}&openReview=1`} onClick={(e) => { e.stopPropagation(); markRead() }}>
                                    <Button variant="outline" size="sm" className="gap-1.5 !h-8 text-xs shrink-0">
                                      <Star className="h-3.5 w-3.5" />
                                      Ohodnotit prodejce
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Dialog open={!!cancelReservationDialog} onOpenChange={(open) => !open && setCancelReservationDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Zrušit rezervaci?</DialogTitle>
            <DialogDescription>
              {cancelReservationDialog && `Opravdu chcete zrušit rezervaci produktu „${cancelReservationDialog.productName}"? Kupující dostane upozornění.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelReservationDialog(null)}>Zrušit</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!cancelReservationDialog) return
                setCancelingProductId(cancelReservationDialog.productId)
                const err = await cancelReservationAction(cancelReservationDialog.productId)
                setCancelingProductId(null)
                setCancelReservationDialog(null)
                if (err?.error) toast.error(err.error)
                else getNotificationsAction().then(({ notifications: list }) => setNotifications(list ?? []))
              }}
              disabled={!!cancelingProductId}
            >
              {cancelingProductId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ano, zrušit rezervaci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
