# Cierre de produccion

Checklist corto para dejar Multi Accesorios listo para operar.

## Variables en Vercel

- `NEXT_PUBLIC_APP_URL=https://multiaccesorios.cl`
- `NEXTAUTH_URL=https://multiaccesorios.cl`
- `NEXTAUTH_SECRET`: secreto largo y unico.
- `ADMIN_USERNAME`: usuario admin real.
- `ADMIN_PASSWORD`: clave admin real.
- `ADMIN_BYPASS_LOGIN=false`
- `CHECKOUT_ENABLE_MERCADOPAGO=true`
- `MERCADOPAGO_ACCESS_TOKEN`: token productivo de Mercado Pago.
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: public key productiva.
- `DATABASE_URL`, `DIRECT_URL`: Supabase.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publico.
- `SUPABASE_SERVICE_ROLE_KEY`: solo servidor, para Storage/importacion.
- `BSALE_ACCESS_TOKEN`: solo lectura. No usar Sync Bsale en produccion sin autorizacion.

## Dominio

1. Pagar/activar el dominio en NeboxHost.
2. Agregar `multiaccesorios.cl` y `www.multiaccesorios.cl` en Vercel.
3. Copiar en NeboxHost los registros DNS exactos que entregue Vercel.
4. Cuando Vercel marque el dominio como valido, actualizar `NEXT_PUBLIC_APP_URL` y `NEXTAUTH_URL`.
5. Redeploy.

## Pruebas finales

- Abrir `/api/health` y revisar que no diga `missing` ni `unsafe`.
- Entrar a `/admin/login` con credenciales reales.
- Crear pedido de prueba de bajo monto con Mercado Pago.
- Confirmar que vuelve a `/shop/success`.
- Revisar el pedido en Admin > Pedidos.
- Revisar que el catalogo publico solo muestre categorias habilitadas.
