export async function getProductImages(
  productName: string
): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey) {
    console.warn('Sin UNSPLASH_ACCESS_KEY, usando fallback')
    return []
  }

  function cleanProductName(name: string): string {
    return name
      .replace(/carcasa/gi, 'phone case')
      .replace(/funda/gi, 'phone case')
      .replace(/cargador/gi, 'charger')
      .replace(/cable/gi, 'usb cable')
      .replace(/audifonos/gi, 'headphones')
      .replace(/lamina/gi, 'screen protector')
      .replace(/vidrio/gi, 'screen protector')
      .replace(/vaper/gi, 'vape')
      .replace(/computacion/gi, 'laptop accessories')
  }

  try {
    const query = encodeURIComponent(cleanProductName(productName))
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=4&orientation=squarish`

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    })

    if (!res.ok) {
      console.warn(`Unsplash error ${res.status} para: ${productName}`)
      return []
    }

    const data = await res.json()

    return data.results.map(
      (photo: { urls: { regular: string } }) => photo.urls.regular
    )
  } catch (err) {
    console.warn('Error buscando imágenes:', err)
    return []
  }
}