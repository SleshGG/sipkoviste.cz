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
} from 'lucide-react'

import { brands, conditions, supabase } from '@/lib/data'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  images: z.array(z.string()).min(1, "Přidejte alespoň jednu fotku"),
  category: z.string().min(1, "Vyberte kategorii"),
  title: z.string().min(5, "Název musí mít alespoň 5 znaků").max(60),
  brand: z.string().min(1, "Vyberte značku"),
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
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

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

  useEffect(() => {
    return () => {
      formData.images.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [formData.images])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (formData.images.length + files.length > 6) return

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setUploadingFiles(prev => [...prev, ...files])
    setValue('images', [...formData.images, ...newPreviewUrls], { shouldValidate: true })
  }

  const removeImage = (index: number) => {
    const updatedPreviews = formData.images.filter((_, i) => i !== index)
    const updatedFiles = uploadingFiles.filter((_, i) => i !== index)
    setUploadingFiles(updatedFiles)
    setValue('images', updatedPreviews, { shouldValidate: true })
  }

  const handleNext = async () => {
    const fieldsByStep: (keyof FormData)[][] = [['images'], ['category'], ['title', 'brand', 'condition'], ['price']]
    const isStepValid = await trigger(fieldsByStep[currentStep - 1])
    if (isStepValid && currentStep < steps.length) setCurrentStep(prev => prev + 1)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Nepřihlášený uživatel")

      const uploadedUrls = []
      for (const file of uploadingFiles) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { data: upData, error: upErr } = await supabase.storage.from('product-images').upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        uploadedUrls.push(publicUrl)
      }

      const { error: dbErr } = await supabase.from('products').insert({
        name: data.title,
        brand: data.brand,
        price: parseFloat(data.price),
        condition: data.condition,
        category: data.category,
        description: data.description,
        images: uploadedUrls,
        image: uploadedUrls[0] || '',
        seller_id: user.id,
        negotiable: data.negotiable
      })

      if (dbErr) throw dbErr
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      alert("Chyba při ukládání inzerátu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Vytvořit inzerát</h1>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-4 md:p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-4">Přidat fotky (max 6)</h2>
                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image src={img} alt="Preview" fill className="object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive p-1 rounded-full text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {formData.images.length < 6 && (
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground"><ImagePlus /></button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImageUpload} />
                {errors.images && <p className="text-destructive text-xs mt-2">{errors.images.message}</p>}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-4">Kategorie</h2>
                <div className="space-y-3">
                  {categoryOptions.map(cat => (
                    <div key={cat.id} onClick={() => { setValue('category', cat.id); setTimeout(handleNext, 200); }} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer", formData.category === cat.id ? "border-primary bg-primary/5" : "border-transparent bg-secondary")}>
                      <cat.icon /> <div><p className="font-bold text-sm">{cat.name}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid gap-2"><Label>Název inzerátu *</Label><Input {...register('title')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Značka *</Label>
                    <Select onValueChange={(v) => setValue('brand', v)} value={formData.brand}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2"><Label>Stav *</Label>
                    <Select onValueChange={(v) => setValue('condition', v)} value={formData.condition}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{conditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2"><Label>Popis</Label><Textarea {...register('description')} /></div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid gap-2"><Label className="text-lg">Cena v Kč *</Label>
                  <Input type="number" {...register('price')} className="text-2xl font-bold h-14" />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <span>Otevřeno nabídkám?</span>
                  <input type="checkbox" className="h-5 w-5" checked={formData.negotiable} onChange={(e) => setValue('negotiable', e.target.checked)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1}><ChevronLeft /> Zpět</Button>
            {currentStep < 4 ? <Button onClick={handleNext}>Další <ChevronRight /></Button> : <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? "Publikuji..." : "Publikovat"}</Button>}
          </div>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}