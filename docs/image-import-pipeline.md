# Image import pipeline

El scraper solo descubre URLs externas. Antes de guardar una imagen publica:

1. descarga la URL;
2. valida `content-type`, peso maximo, resolucion minima 800x800 y archivo legible;
3. rechaza placeholders o formatos no soportados;
4. calcula hash SHA-256 para deduplicar;
5. normaliza con Sharp a lienzo cuadrado sin deformar;
6. genera WebP `thumb` 320px, `medium` 800px y `large` 1200px;
7. sube a Supabase Storage bucket `products`;
8. guarda en `ImportedImage` la URL original, hash y URLs propias;
9. productos/variantes usan `mediumUrl`; `og:image` usa `largeUrl`.

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` recomendado para importacion server-side

Migracion:

- `prisma db push` crea `ImportedImage`.

Prueba:

- En admin, ejecutar `Buscar imagenes`.
- Revisar que `Product.imageUrl` apunte a `*.supabase.co/storage/v1/object/public/products/imported/.../medium.webp`.
