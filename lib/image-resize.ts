/**
 * Zmenší obrázek na straně klienta (Canvas). Použití před odesláním na server
 * zrychlí upload a zabrání překročení limitu velikosti.
 *
 * Obrázky větší než maxSizeBytes se zmenší na max 1200px (delší strana), JPEG ~82%.
 * Malé soubory se vrací beze změny.
 */

const MAX_EDGE = 1200
const JPEG_QUALITY = 0.82
const MIN_SIZE_TO_RESIZE = 400 * 1024 // 400 KB – menší neřešíme

export async function resizeImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= MIN_SIZE_TO_RESIZE) return file

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      if (width <= MAX_EDGE && height <= MAX_EDGE && file.size <= 800 * 1024) {
        resolve(file)
        return
      }

      let w = width
      let h = height
      if (width > MAX_EDGE || height > MAX_EDGE) {
        if (width >= height) {
          w = MAX_EDGE
          h = Math.round((height * MAX_EDGE) / width)
        } else {
          h = MAX_EDGE
          w = Math.round((width * MAX_EDGE) / height)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

export async function resizeImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(resizeImageIfNeeded))
}
