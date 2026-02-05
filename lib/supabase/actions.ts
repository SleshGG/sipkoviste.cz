'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import type { ProductInsert, MessageInsert } from './types'

// ============ AUTH ACTIONS ============

export async function signUp(email: string, password: string, name: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      data: {
        name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { data }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ============ PRODUCT ACTIONS ============

export async function createProductAction(product: ProductInsert) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, seller_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { error: 'Nepodařilo se vytvořit inzerát' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  return { data }
}

export async function updateProductAction(id: string, updates: Partial<ProductInsert>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', user.id) // Ensure user owns the product
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { error: 'Nepodařilo se aktualizovat inzerát' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  revalidatePath(`/product/${id}`)
  return { data }
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id) // Ensure user owns the product

  if (error) {
    console.error('Error deleting product:', error)
    return { error: 'Nepodařilo se smazat inzerát' }
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============ MESSAGE ACTIONS ============

export async function sendMessageAction(message: Omit<MessageInsert, 'sender_id'>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, sender_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { error: 'Nepodařilo se odeslat zprávu' }
  }

  revalidatePath('/messages')
  return { data }
}

export async function markMessagesAsReadAction(senderId: string, productId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', senderId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error marking messages as read:', error)
    return { error: 'Nepodařilo se označit zprávy jako přečtené' }
  }

  revalidatePath('/messages')
  return { success: true }
}

// ============ PROFILE ACTIONS ============

export async function updateProfileAction(updates: { name?: string; avatar_url?: string }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Nepodařilo se aktualizovat profil' }
  }

  revalidatePath('/dashboard')
  return { data }
}

// ============ IMAGE UPLOAD ============

export async function uploadProductImage(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Musíte být přihlášeni' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'Nebyl vybrán žádný soubor' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (error) {
    console.error('Error uploading image:', error)
    return { error: 'Nepodařilo se nahrát obrázek' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return { url: publicUrl }
}
