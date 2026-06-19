# Webpay Plus - estado local

## Flujo implementado

- El carrito valida stock y descuentos contra Supabase antes de avanzar.
- Webpay se inicia desde `POST /api/payments/webpay/create`.
- El servidor recalcula precios, descuentos y total; no usa `total` ni `unitPrice` enviados por el navegador.
- La orden queda `webpay_pending` hasta que Transbank retorna.
- El retorno llega a `/api/payments/webpay/commit` por `GET` o `POST`.
- El commit valida `response_code`, monto, orden de compra y sesion.
- Si Webpay aprueba, la orden queda `paid` y se descuenta solo stock local Supabase.
- Si Webpay cancela o falla, la orden queda marcada como cancelada/fallida y no descuenta stock.
- Si Webpay aprueba pero el stock local ya no alcanza, la orden queda `paid_stock_review`.
- No hay llamadas a Bsale en el flujo de pago.

## Variables necesarias

Integracion local:

```env
WEBPAY_ENV=integration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Produccion:

```env
WEBPAY_ENV=production
WEBPAY_COMMERCE_CODE=...
WEBPAY_API_KEY=...
NEXT_PUBLIC_APP_URL=https://multiaccesorios.vercel.app
```

## Pruebas ejecutadas

- Carrito vacio, producto inexistente, cantidades invalidas y stock insuficiente retornan `400`.
- Items duplicados se agrupan antes de validar stock.
- Webpay create ignora precios manipulados desde cliente.
- Retorno cancelado con `TBK_TOKEN`, `TBK_ID_SESION` y `TBK_ORDEN_COMPRA` marca orden cancelada.
- Token desconocido redirige a `payment=unknown`.
- `npm run build`, `npm run lint` y `npx tsc --noEmit` pasan correctamente.

## Pendiente antes de llamar produccion lista

- Ejecutar un pago aprobado completo en Webpay integracion desde un navegador normal.
- Configurar credenciales reales en Vercel.
- Aplicar cambios de schema en la base productiva antes del deploy.
- Confirmar con el administrador la cuenta bancaria asociada al comercio Transbank.
