'use client'

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
} from 'lucide-react'

import { brands, materials, weights, conditions } from '@/lib/data'
import { cn } from '@/lib/utils'

// Definice validačního schématu pomocí Zod
const formSchema = z.object({
  images: z.array(z.string()).min(1, "Přidejte alespoň jednu fotku"),
  category: z.string().min(1, "Vyberte kategorii"),
  title: z.string().min(5, "Název musí mít alespoň 5 znaků").max(60),
  brand: z.string().min(1, "Vyberte značku"),
  weight: z.string().optional(),
  material: z.string().optional(),
  condition: z.string().min(1, "Vyberte stav"),
  description: z.string().max(1000).optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Cena musí být kladné číslo",
  }),
  negotiable: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>

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

export default function SellPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: [],
      category: '',
      title: '',
      brand: '',
      condition: '',
      price: '',
      negotiable: false,
    }
  })

  const formData = watch()
  const progress = (currentStep / steps.length) * 100

  // Čištění paměti od Object URLs
  useEffect(() => {
    return () => {
      formData.images.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [formData.images])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map((file) => URL.createObjectURL(file))

    setValue('images', [...formData.images, ...newImages].slice(0, 6), { shouldValidate: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    const urlToRemove = formData.images[index]
    if (urlToRemove.startsWith('blob:')) URL.revokeObjectURL(urlToRemove)

    const updatedImages = formData.images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleNext = async () => {
    // Validace polí v aktuálním kroku před posunem dál
    const fieldsByStep: (keyof FormData)[][] = [
      ['images'],
      ['category'],
      ['title', 'brand', 'condition'],
      ['price']
    ]

    const isStepValid = await trigger(fieldsByStep[currentStep - 1])
    if (isStepValid && currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    console.log("Odesílám data:", data)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Vytvořit inzerát</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Prodejte své šipkařské vybavení tisícům hráčů
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 transition-colors',
                  step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}>
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className={cn(
                  "text-[10px] md:text-xs font-medium hidden sm:block transition-colors",
                  step.id === currentStep ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-border bg-card p-4 md:p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {/* KROK 1: FOTKY */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <h2 className="text-lg font-semibold mb-1">Přidat fotky</h2>
                <p className="text-sm text-muted-foreground mb-6">První fotka bude úvodní. (Max 6 fotek)</p>

                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary group border border-border">
                      <Image src={image} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-all"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Přidat</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                {errors.images && <p className="text-destructive text-xs mt-3">{errors.images.message}</p>}
              </motion.div>
            )}

            {/* KROK 2: KATEGORIE */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <h2 className="text-lg font-semibold mb-6">Vyberte kategorii</h2>
                <div className="space-y-3">
                  {categoryOptions.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = formData.category === cat.id
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setValue('category', cat.id, { shouldValidate: true })
                          setTimeout(handleNext, 300) // Automatický posun pro lepší flow
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent bg-secondary/50 hover:bg-secondary"
                        )}
                      >
                        <div className={cn("p-3 rounded-lg", isSelected ? "bg-primary text-primary-foreground" : "bg-background")}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm md:text-base">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* KROK 3: DETAILY */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="title">Název inzerátu *</Label>
                  <Input id="title" {...register('title')} placeholder="např. Target Gabriel Clemens Gen 2" />
                  {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Značka *</Label>
                    <Select onValueChange={(val) => setValue('brand', val, { shouldValidate: true })} value={formData.brand}>
                      <SelectTrigger><SelectValue placeholder="Vyberte" /></SelectTrigger>
                      <SelectContent>
                        {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        <SelectItem value="other">Jiná</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Stav *</Label>
                    <Select onValueChange={(val) => setValue('condition', val, { shouldValidate: true })} value={formData.condition}>
                      <SelectTrigger><SelectValue placeholder="Vyberte" /></SelectTrigger>
                      <SelectContent>
                        {conditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description text-xs uppercase text-muted-foreground tracking-widest">Podrobný popis</Label>
                  <Textarea id="description" {...register('description')} placeholder="V jakém stavu jsou hroty? Jak dlouho byly hrané?" rows={4} />
                </div>
              </motion.div>
            )}

            {/* KROK 4: CENA */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-lg">Cena v Kč *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      {...register('price')}
                      className="text-2xl font-bold h-14 pr-12"
                      placeholder="0"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">Kč</span>
                  </div>
                  {errors.price && <p className="text-destructive text-xs">{errors.price.message}</p>}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-secondary bg-secondary/20">
                  <div>
                    <p className="font-bold text-sm">Otevřeno nabídkám?</p>
                    <p className="text-xs text-muted-foreground">Povolit kupujícím smlouvat o ceně</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('negotiable', !formData.negotiable)}
                    className={cn(
                      'h-6 w-11 rounded-full transition-all relative',
                      formData.negotiable ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 h-4 w-4 rounded-full bg-white transition-all',
                      formData.negotiable ? 'left-6' : 'left-1'
                    )} />
                  </button>
                </div>

                {/* Náhled před odesláním */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden shrink-0 border border-border">
                    <Image src={formData.images[0] || "/placeholder.svg"} alt="Final" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold truncate">{formData.title || 'Bez názvu'}</p>
                    <p className="text-sm text-primary font-black text-xl">
                      {formData.price ? Number(formData.price).toLocaleString('cs-CZ') : '0'} Kč
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button variant="ghost" type="button" onClick={handleBack} disabled={currentStep === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Zpět
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={handleNext} className="px-8 shadow-md">
                Další <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-8 bg-primary hover:bg-primary/90 shadow-lg"
              >
                {isSubmitting ? "Publikuji..." : "Publikovat inzerát"}
              </Button>
            )}
          </div>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}