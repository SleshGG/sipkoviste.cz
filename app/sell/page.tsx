'use client'

import React from "react"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Progress } from '@/components/ui/progress'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  ImagePlus,
  Target,
  CircleDot,
  Circle,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { brands, materials, weights, conditions } from '@/lib/data'
import { cn } from '@/lib/utils'
import { createProductAction } from '@/lib/supabase/actions'
import { uploadProductImage } from '@/lib/supabase/upload'
import type { ProductInsert } from '@/lib/supabase/types'

const steps = [
  { id: 1, name: 'Fotky', description: 'Přidejte obrázky' },
  { id: 2, name: 'Kategorie', description: 'Vyberte kategorii' },
  { id: 3, name: 'Detaily', description: 'Specifikace položky' },
  { id: 4, name: 'Cena', description: 'Nastavte cenu' },
]

const categoryOptions = [
  { id: 'steel-darts', name: 'Ocelové šipky', icon: Target, description: 'Ocelové hroty pro sisalové terče' },
  { id: 'soft-darts', name: 'Softové šipky', icon: CircleDot, description: 'Plastové hroty pro elektronické terče' },
  { id: 'dartboards', name: 'Terče', icon: Circle, description: 'Sisalové, elektronické a cvičné terče' },
  { id: 'accessories', name: 'Příslušenství', icon: Package, description: 'Letky, násadky, pouzdra a další' },
]

interface ImageFile {
  file: File
  preview: string
}

interface SellFormData {
  images: ImageFile[]
  category: string
  title: string
  brand: string
  weight: string
  material: string
  condition: string
  description: string
  price: string
  negotiable: boolean
}

export default function SellPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<SellFormData>({
    images: [],
    category: '',
    title: '',
    brand: '',
    weight: '',
    material: '',
    condition: '',
    description: '',
    price: '',
    negotiable: false,
  })

  const progress = (currentStep / steps.length) * 100

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages: ImageFile[] = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 6),
      }))
    }
  }

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(formData.images[index].preview)
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.images.length > 0
      case 2:
        return formData.category !== ''
      case 3:
        return (
          formData.title !== '' &&
          formData.brand !== '' &&
          formData.condition !== ''
        )
      case 4:
        return formData.price !== '' && parseFloat(formData.price) > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Upload images to Supabase Storage first
      const uploadedUrls: string[] = []
      
      for (const imageFile of formData.images) {
        console.log('[v0] Uploading image:', imageFile.file.name)
        const uploadResult = await uploadProductImage(imageFile.file)
        
        if (uploadResult.error) {
          setError(`Chyba pri nahravani obrazku: ${uploadResult.error}`)
          setIsSubmitting(false)
          return
        }
        
        if (uploadResult.url) {
          uploadedUrls.push(uploadResult.url)
        }
      }
      
      console.log('[v0] All images uploaded:', uploadedUrls)
      
      const productData: ProductInsert = {
        seller_id: '', // Will be set by the server action
        name: formData.title,
        brand: formData.brand,
        price: parseInt(formData.price),
        weight: formData.weight || null,
        material: formData.material || null,
        condition: formData.condition as 'Nove' | 'Jako nove' | 'Dobre' | 'Uspokojive',
        category: formData.category as 'steel-darts' | 'soft-darts' | 'dartboards' | 'accessories',
        image: uploadedUrls[0] || null,
        images: uploadedUrls,
        description: formData.description || null,
        negotiable: formData.negotiable,
        specs: {},
      }

      const result = await createProductAction(productData)
      
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.log('[v0] Submit error:', err)
      setError('Nepodarilo se vytvorit inzerat. Zkuste to prosim znovu.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Vytvořit inzerát</h1>
          <p className="text-muted-foreground">
            Prodejte své šipkařské vybavení tisícům hráčů
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-8"
        >
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center text-center',
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                      ? 'text-primary/60'
                      : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium mb-1',
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form Steps */}
        <Card className="border-border bg-card p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Photos */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Přidat fotky</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Přidejte až 6 fotek. První fotka bude úvodní obrázek.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />

                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((imageFile, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                    >
                      <Image
                        src={imageFile.preview || "/placeholder.svg"}
                        alt={`Nahrani ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Úvodní
                        </span>
                      )}
                    </div>
                  ))}

                  {formData.images.length < 6 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Přidat fotku</span>
                    </button>
                  )}
                </div>

                {formData.images.length === 0 && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Přidejte alespoň jednu fotku</p>
                        <p className="text-xs text-muted-foreground">
                          Inzeráty s fotkami mají 10x více zobrazení
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Category */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Vybrat kategorii</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Vyberte kategorii, která nejlépe odpovídá vaší položce
                </p>

                <RadioGroup
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  className="grid gap-3"
                >
                  {categoryOptions.map((category) => {
                    const Icon = category.icon
                    return (
                      <Label
                        key={category.id}
                        htmlFor={category.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                          formData.category === category.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-secondary/50'
                        )}
                      >
                        <RadioGroupItem value={category.id} id={category.id} className="sr-only" />
                        <div
                          className={cn(
                            'h-12 w-12 rounded-lg flex items-center justify-center',
                            formData.category === category.id
                              ? 'bg-primary/20'
                              : 'bg-secondary'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-6 w-6',
                              formData.category === category.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        {formData.category === category.id && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </Label>
                    )
                  })}
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Detaily položky</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Zadejte přesné údaje, které pomohou kupujícím najít vaši položku
                </p>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Název *</Label>
                    <Input
                      id="title"
                      placeholder="např. Target Gabriel Clemens Gen 2 Darts"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Značka *</Label>
                      <Select
                        value={formData.brand}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, brand: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte značku" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Jiná</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="condition">Stav *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte stav" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(formData.category === 'steel-darts' || formData.category === 'soft-darts') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="weight">Hmotnost</Label>
                        <Select
                          value={formData.weight}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, weight: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte hmotnost" />
                          </SelectTrigger>
                          <SelectContent>
                            {weights.map((weight) => (
                              <SelectItem key={weight} value={weight}>
                                {weight}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="material">Materiál</Label>
                        <Select
                          value={formData.material}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, material: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte materiál" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material} value={material}>
                                {material}
                              </SelectItem>
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
                      placeholder="Popište svou položku podrobně - stav, použití, součásti balení atd."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Nastavte cenu</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Nastavte konkurenční cenu pro přilákání kupujících
                </p>

                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Cena *</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        className="pr-12"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        Kč
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Otevřeno nabídkám?</p>
                      <p className="text-sm text-muted-foreground">
                        Umožnit kupujícím činit cenové nabídky
                      </p>
                    </div>
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, negotiable: !prev.negotiable }))}
                      className={cn(
                        'h-6 w-11 rounded-full transition-colors relative',
                        formData.negotiable ? 'bg-primary' : 'bg-secondary'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          formData.negotiable ? 'left-[22px]' : 'left-0.5'
                        )}
                      />
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-secondary rounded-lg space-y-3">
                    <h3 className="font-medium">Souhrn inzerátu</h3>
                    <div className="flex gap-3">
                      {formData.images[0] && (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={formData.images[0] || "/placeholder.svg"}
                            alt="Náhled"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{formData.title || 'Bez názvu'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.brand} · {formData.condition}
                        </p>
                        {formData.price && (
                          <p className="text-lg font-bold text-primary mt-1">
                            {parseFloat(formData.price).toLocaleString('cs-CZ')} Kč
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                Další
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publikuji...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Publikovat inzerat
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </main>

      <MobileNav />
    </div>
  )
}
