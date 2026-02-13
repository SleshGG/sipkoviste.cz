'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Target, CircleDot, Circle, Package, AlertCircle, Loader2, X, ImagePlus, Star } from 'lucide-react'
import { brands, materials, weights, conditions } from '@/lib/data'
import { cn } from '@/lib/utils'
import { updateProductAction, uploadProductImagesAction } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/client'
import { resizeImageFiles } from '@/lib/image-resize'
import type { Product } from '@/lib/supabase/types'

const MAX_IMAGES = 6

const categoryOptions = [
  { id: 'steel-darts', name: 'Ocelové šipky', icon: Target },
  { id: 'soft-darts', name: 'Softové šipky', icon: CircleDot },
  { id: 'dartboards', name: 'Terče', icon: Circle },
  { id: 'accessories', name: 'Příslušenství', icon: Package },
]

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [weight, setWeight] = useState('')
  const [material, setMaterial] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [mainNewImageIndex, setMainNewImageIndex] = useState<number | null>(null)
  const [isResizingImages, setIsResizingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user.id)
        .single()

      if (fetchError || !data) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setProduct(data as Product)
      setTitle(data.name)
      setBrand(data.brand)
      setCategory(data.category)
      setCondition(data.condition)
      setWeight(data.weight || '')
      setMaterial(data.material || '')
      setDescription(data.description || '')
      setPrice(String(data.price))
      setNegotiable(data.negotiable ?? false)
      const urls = data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : [])
      setExistingImageUrls(urls)
      setIsLoading(false)
    }

    load()
  }, [id, router])

  const totalImageCount = existingImageUrls.length + newImageFiles.length

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev[index].preview)
      return next
    })
    setMainNewImageIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return newImageFiles.length > 1 ? 0 : null
      if (prev > index) return prev - 1
      return prev
    })
  }

  const setAsMainExisting = (index: number) => {
    if (index === 0) return
    setMainNewImageIndex(null)
    setExistingImageUrls((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(index, 1)
      arr.unshift(item)
      return arr
    })
  }

  const setAsMainNew = (index: number) => {
    setMainNewImageIndex(index)
  }

  const [draggedItem, setDraggedItem] = useState<{ type: 'existing' | 'new'; index: number } | null>(null)
  const draggedItemRef = useRef<{ type: 'existing' | 'new'; index: number } | null>(null)

  const handleDragStart = (e: React.DragEvent, type: 'existing' | 'new', index: number) => {
    if (e.dataTransfer) {
      const img = document.createElement('img')
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      e.dataTransfer.setDragImage(img, 0, 0)
    }
    const item = { type, index }
    setDraggedItem(item)
    draggedItemRef.current = item
  }

  const handleDragOver = (e: React.DragEvent, type: 'existing' | 'new', index: number) => {
    e.preventDefault()
    const from = draggedItemRef.current
    if (!from || from.type !== type || from.index === index) return
    if (type === 'existing') {
      setExistingImageUrls((prev) => {
        const arr = [...prev]
        const [item] = arr.splice(from.index, 1)
        arr.splice(index, 0, item)
        return arr
      })
      draggedItemRef.current = { type, index }
      setDraggedItem({ type, index })
    } else {
      setNewImageFiles((prev) => {
        const arr = [...prev]
        const [item] = arr.splice(from.index, 1)
        arr.splice(index, 0, item)
        return arr
      })
      setMainNewImageIndex((prev) => {
        if (prev === null) return null
        if (from.index === prev) return index
        if (from.index < prev && index >= prev) return prev - 1
        if (from.index > prev && index <= prev) return prev + 1
        return prev
      })
      draggedItemRef.current = { type, index }
      setDraggedItem({ type, index })
    }
  }

  const handleDrop = () => {
    setDraggedItem(null)
    draggedItemRef.current = null
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    draggedItemRef.current = null
  }

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setIsResizingImages(true)
    setError(null)
    try {
      const fileList = Array.from(files)
      const resized = await resizeImageFiles(fileList)
      const toAdd = resized.map((file) => ({ file, preview: URL.createObjectURL(file) }))
      setNewImageFiles((prev) => [...prev, ...toAdd].slice(0, MAX_IMAGES - existingImageUrls.length))
    } catch {
      setError('Nepodařilo se zpracovat fotky. Zkuste to znovu.')
    } finally {
      setIsResizingImages(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (totalImageCount === 0) {
      setError('Přidejte alespoň jednu fotku.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    let finalUrls: string[] = []

    if (newImageFiles.length > 0) {
      const formData = new FormData()
      const orderedNew =
        mainNewImageIndex !== null
          ? [newImageFiles[mainNewImageIndex], ...newImageFiles.filter((_, i) => i !== mainNewImageIndex)]
          : newImageFiles
      orderedNew.forEach(({ file }) => formData.append('images', file))
      const uploadResult = await uploadProductImagesAction(formData)
      if (uploadResult.error) {
        setError(uploadResult.error)
        setIsSubmitting(false)
        return
      }
      const uploadedUrls = uploadResult.urls ?? []
      if (mainNewImageIndex !== null) {
        finalUrls = [uploadedUrls[0], ...existingImageUrls, ...uploadedUrls.slice(1)]
      } else {
        finalUrls = [...existingImageUrls, ...uploadedUrls]
      }
    } else {
      finalUrls = [...existingImageUrls]
    }

    const result = await updateProductAction(product.id, {
      name: title,
      brand,
      category: category as Product['category'],
      condition: condition as Product['condition'],
      weight: weight || null,
      material: material || null,
      description: description || null,
      price: parseInt(price, 10) || 0,
      negotiable,
      image: finalUrls[0] ?? null,
      images: finalUrls,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(`/product/${product.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold mb-2">Inzerát nenalezen</h1>
          <p className="text-muted-foreground mb-4">Nemáte oprávnění ho upravit, nebo byl smazán.</p>
          <Link href="/dashboard">
            <Button>Zpět na nástěnku</Button>
          </Link>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-2 -ml-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Zpět na nástěnku
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-2">Upravit inzerát</h1>
        <p className="text-muted-foreground mb-6">{product.name}</p>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card p-6 space-y-4">
            <div className="grid gap-2">
              <Label>Fotky</Label>
              <p className="text-sm text-muted-foreground mb-2">
                První fotka se zobrazí jako náhled. Přetáhněte fotku pro změnu pořadí, nebo klikněte na hvězdičku (max. {MAX_IMAGES} fotek).
              </p>
              {isResizingImages && (
                <p className="text-sm text-primary font-medium mb-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Zpracovávám fotky…
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddImages}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {existingImageUrls.map((url, index) => {
                  const isMain = index === 0 && mainNewImageIndex === null
                  const isDragging = draggedItem?.type === 'existing' && draggedItem?.index === index
                  return (
                    <div
                      key={`existing-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'existing', index)}
                      onDragOver={(e) => handleDragOver(e, 'existing', index)}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-lg overflow-hidden bg-secondary group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label="Odebrat fotku"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {isMain ? (
                        <span
                          className="absolute bottom-1 left-1 h-7 w-7 rounded bg-background/90 flex items-center justify-center text-primary"
                          title="Úvodní fotka"
                        >
                          <Star className="h-3.5 w-3.5 fill-primary" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAsMainExisting(index)}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Nastavit jako úvodní"
                          className="absolute bottom-1 left-1 h-7 w-7 rounded bg-background/90 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {newImageFiles.map((item, index) => {
                  const isMain =
                    mainNewImageIndex === index ||
                    (mainNewImageIndex === null && existingImageUrls.length === 0 && index === 0)
                  const isDragging = draggedItem?.type === 'new' && draggedItem?.index === index
                  return (
                    <div
                      key={`new-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'new', index)}
                      onDragOver={(e) => handleDragOver(e, 'new', index)}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-lg overflow-hidden bg-secondary group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <Image src={item.preview} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label="Odebrat fotku"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {isMain ? (
                        <span
                          className="absolute bottom-1 left-1 h-7 w-7 rounded bg-background/90 flex items-center justify-center text-primary"
                          title="Úvodní fotka"
                        >
                          <Star className="h-3.5 w-3.5 fill-primary" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAsMainNew(index)}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Nastavit jako úvodní"
                          className="absolute bottom-1 left-1 h-7 w-7 rounded bg-background/90 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {totalImageCount < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isResizingImages}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Přidat fotku</span>
                  </button>
                )}
              </div>
              {totalImageCount === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-500">Přidejte alespoň jednu fotku.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Název *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Značka *</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Značka" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="other">Jiná</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Stav *</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stav" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Kategorie *</Label>
              <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-2 gap-2">
                {categoryOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <Label
                      key={opt.id}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer',
                        category === opt.id ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                      <Icon className="h-4 w-4" />
                      {opt.name}
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>

            {(category === 'steel-darts' || category === 'soft-darts') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hmotnost</Label>
                  <Select value={weight} onValueChange={setWeight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hmotnost" />
                    </SelectTrigger>
                    <SelectContent>
                      {weights.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Materiál</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Materiál" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Cena (Kč) *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">Otevřeno nabídkám?</p>
                <p className="text-sm text-muted-foreground">Umožnit kupujícím činit cenové nabídky</p>
              </div>
              <button
                type="button"
                onClick={() => setNegotiable((v) => !v)}
                className={cn(
                  'h-6 w-11 rounded-full transition-colors relative',
                  negotiable ? 'bg-primary' : 'bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    negotiable ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Zrušit</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Uložit změny
              </Button>
            </div>
          </Card>
        </form>
      </main>

      <MobileNav />
    </div>
  )
}
