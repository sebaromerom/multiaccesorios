from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "reportes"
PDF_PATH = OUT_DIR / "informe_avance_multi_accesorios.pdf"

RED = colors.HexColor("#E30613")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
BLUE = colors.HexColor("#2E74B5")
DARK_BLUE = colors.HexColor("#1F4D78")
LIGHT_BLUE = colors.HexColor("#E8EEF5")
LIGHT_GRAY = colors.HexColor("#F5F6F8")
GREEN = colors.HexColor("#EAF7EE")
AMBER = colors.HexColor("#FFF7E6")
RED_FILL = colors.HexColor("#FDEBEC")
BORDER = colors.HexColor("#D8DEE8")


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleCustom",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=27,
            textColor=DARK_BLUE,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=MUTED,
            spaceAfter=14,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=BLUE,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=BLUE,
            spaceBefore=10,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "BodyCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.4,
            leading=12.2,
            textColor=INK,
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.2,
            textColor=INK,
        ),
        "small_bold": ParagraphStyle(
            "SmallBold",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10.2,
            textColor=INK,
        ),
        "white": ParagraphStyle(
            "White",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.white,
            alignment=TA_CENTER,
        ),
        "callout_title": ParagraphStyle(
            "CalloutTitle",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=12,
            textColor=DARK_BLUE,
            spaceAfter=3,
        ),
    }


S = styles()


def bullet(text: str):
    return p(f"&bull; {text}", S["body"])


def step(num: int, text: str):
    return p(f"<b>{num}.</b> {text}", S["body"])


def callout(title: str, body: str, fill=LIGHT_GRAY):
    table = Table(
        [[p(title, S["callout_title"])], [p(body, S["small"])]],
        colWidths=[6.75 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return [table, Spacer(1, 9)]


def grid_table(headers, rows, widths, header_fill=LIGHT_BLUE, status=False):
    data = [[p(h, S["small_bold"]) for h in headers]]
    for row in rows:
        data.append([p(str(cell), S["small"]) for cell in row])
    table = Table(data, colWidths=[w * inch for w in widths], repeatRows=1)
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), header_fill),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if status:
        fill_by_status = {"Listo": GREEN, "Local": AMBER, "Pendiente": RED_FILL}
        for idx, row in enumerate(rows, start=1):
            commands.append(("BACKGROUND", (0, idx), (0, idx), fill_by_status.get(row[0], LIGHT_GRAY)))
    table.setStyle(TableStyle(commands))
    return [table, Spacer(1, 9)]


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.45 * inch, "Multi Accesorios - Informe de avance y operación")
    canvas.drawRightString(7.75 * inch, 0.45 * inch, f"Página {doc.page}")
    canvas.restoreState()


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title="Informe de avance Multi Accesorios",
        author="Codex",
    )
    story = []

    brand = Table(
        [[p("<font color='#E30613' size='28'><b><i>m</i></b></font>", S["body"]), p("<b>MULTI<br/>ACCESORIOS</b>", S["h2"])]],
        colWidths=[0.42 * inch, 2.1 * inch],
    )
    brand.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    story.append(brand)
    story.append(Spacer(1, 10))
    story.append(p("Informe de avance, operación y próximos pasos", S["title"]))
    story.append(p("Proyecto tienda online, administración, sincronización Bsale/Supabase y pagos - 4 de junio de 2026", S["subtitle"]))
    story.extend(callout("Resumen ejecutivo", "La tienda ya cuenta con una experiencia marketplace más completa, catálogo conectado a Supabase, enriquecimiento de imágenes, carrito/checkout, administración de pedidos y una primera integración local de Webpay en ambiente de prueba. La regla operativa definida es clara: Bsale no se modifica desde la tienda; la app trabaja sobre Supabase y Bsale queda como fuente de sincronización.", LIGHT_BLUE))

    story.extend(grid_table(
        ["Estado", "Área", "Detalle"],
        [
            ["Listo", "Diseño público", "Home, catálogo, detalle de producto, carrito y navegación fueron llevados a una estética marketplace más profesional en escritorio y móvil."],
            ["Listo", "Catálogo", "Categorías principales activas, incluyendo Vapers; productos reales desde Supabase, con imágenes principales y variantes con fallback cuando no hay match confiable."],
            ["Listo", "Administración", "Admin de productos, pedidos, descuentos y métricas adaptado a la nueva estética y preparado para revisar pedidos."],
            ["Local", "Transacciones", "Checkout local con métodos transferencia, pago al retirar, link de pago y Webpay en modo integración. Pendiente cerrar pruebas reales y push/deploy."],
            ["Local", "Webpay", "SDK Transbank agregado; endpoints de creación y confirmación implementados. El dinero real llegará al comercio configurado en Transbank cuando se usen credenciales productivas."],
            ["Pendiente", "Producción", "Credenciales productivas Webpay, datos bancarios definitivos, textos legales y prueba de flujo completo antes de habilitar pagos reales."],
        ],
        [1.05, 1.65, 4.1],
        status=True,
    ))

    story.append(p("1. Qué está funcionando hoy", S["h1"]))
    for item in [
        "Catálogo público con filtros por categorías, ordenamiento y navegación a ofertas, nuevos, más vendidos y marcas.",
        "Diseño responsive de home, shop, carrito, detalle de producto y administración.",
        "Detalle de producto con variantes, imagen principal, galería, estado de stock y barra móvil de compra.",
        "Carrito con resumen, descuentos, datos de cliente y selección de entrega.",
        "Sincronización Bsale -> Supabase para productos, precios y stock; no hay escritura hacia Bsale desde la tienda.",
        "Flujo local de transacciones: el pedido guarda método/estado de pago, referencia y datos de entrega en Supabase.",
    ]:
        story.append(bullet(item))

    story.append(PageBreak())
    story.append(p("2. Regla crítica: Bsale y Supabase", S["h1"]))
    story.extend(callout("Regla acordada", "La tienda no debe descontar ni modificar stock directamente en Bsale. Bsale queda como sistema externo de referencia/sincronización. Supabase actúa como base operativa de la web: catálogo mostrado, pedidos, estados de pago, referencias y ajustes locales.", AMBER))
    story.extend(grid_table(
        ["Sistema", "Rol", "Qué se puede hacer"],
        [
            ["Bsale", "Fuente externa de productos/precios/stock", "Leer y sincronizar hacia Supabase. No modificar stock desde la tienda."],
            ["Supabase", "Base de la tienda", "Guardar productos, imágenes, variantes, pedidos, pagos y estados visibles en admin."],
            ["Vercel/Next.js", "Aplicación web", "Mostrar tienda, procesar checkout, iniciar pagos Webpay y registrar resultados."],
            ["Transbank/Webpay", "Procesador de pago", "Recibir pago del cliente y abonar al comercio contratado en Transbank."],
        ],
        [1.15, 2.0, 3.6],
    ))

    story.append(p("3. Manual corto para el administrador", S["h1"]))
    story.append(p("3.1 Revisión de productos", S["h2"]))
    for i, item in enumerate([
        "Entrar al panel de administración.",
        "Abrir Productos para revisar nombre, precio, categoría, stock visible e imágenes.",
        "Si un producto no tiene imagen confiable, mantener fallback o subir una imagen manual.",
        "Evitar editar stock manualmente si se está usando Bsale como fuente de verdad, salvo corrección puntual autorizada.",
    ], 1):
        story.append(step(i, item))

    story.append(p("3.2 Revisión de pedidos", S["h2"]))
    for i, item in enumerate([
        "Entrar a Pedidos.",
        "Revisar cliente, teléfono, correo, tipo de entrega y productos solicitados.",
        "Revisar el bloque de pago: método, estado y referencia.",
        "Para transferencia o link de pago, confirmar comprobante antes de preparar despacho.",
        "Para Webpay, considerar pagado solo cuando el estado indique Pagado/Webpay aprobado.",
    ], 1):
        story.append(step(i, item))

    story.append(p("3.3 Operación de pagos manuales", S["h2"]))
    story.extend(grid_table(
        ["Método", "Cómo se usa", "Acción del administrador"],
        [
            ["Transferencia", "Cliente confirma pedido y recibe instrucciones.", "Esperar comprobante, validar monto/referencia y preparar pedido."],
            ["Pago al retirar", "Cliente reserva y paga en tienda.", "Apartar pedido si corresponde y cobrar al entregar."],
            ["Link de pago", "Cliente solicita link manual.", "Enviar link por WhatsApp/teléfono registrado y marcar pagado tras confirmación."],
            ["Webpay", "Cliente paga en Transbank.", "Revisar estado aprobado en admin; no preparar si aparece fallido o pendiente."],
        ],
        [1.25, 2.35, 3.2],
    ))

    story.append(p("4. Webpay: estado actual y qué falta", S["h1"]))
    for item in [
        "Implementado localmente el SDK oficial transbank-sdk.",
        "Implementado endpoint para crear transacción Webpay y redirigir al cliente.",
        "Implementado endpoint de retorno para confirmar token_ws con Transbank.",
        "Si Webpay aprueba, el pedido queda como pagado y se descuenta stock local en Supabase.",
        "En ambiente de integración no se mueve dinero real; se usan credenciales y tarjetas de prueba.",
    ]:
        story.append(bullet(item))
    story.extend(callout("A quién llega el dinero", "En producción, el dinero llega al comercio asociado al código de comercio Webpay configurado en Transbank. Debe ser el contrato de Multi Accesorios SpA y la cuenta bancaria registrada en Transbank. La app no decide la cuenta de abono.", GREEN))
    story.extend(grid_table(
        ["Falta", "Responsable sugerido", "Observación"],
        [
            ["Contrato/credenciales Webpay productivas", "Administración/contador/representante legal", "Solicitar o confirmar comercio productivo en Transbank."],
            ["Variables de entorno", "Desarrollo", "WEBPAY_ENV, WEBPAY_COMMERCE_CODE, WEBPAY_API_KEY y NEXT_PUBLIC_APP_URL."],
            ["Pruebas con tarjetas de integración", "Desarrollo + administración", "Compra aprobada, rechazada, cancelada y retorno correcto."],
            ["Políticas visibles", "Administración", "Cambios/devoluciones, privacidad, despacho, términos y contacto."],
            ["Conciliación diaria", "Administración", "Comparar pedidos pagados en Supabase con abonos/reportes Transbank."],
        ],
        [2.0, 1.75, 3.05],
    ))

    story.append(PageBreak())
    story.append(p("5. Detallitos pendientes antes de producción", S["h1"]))
    story.extend(grid_table(
        ["Estado", "Área", "Detalle"],
        [
            ["Pendiente", "Legal/operación", "Agregar textos formales de términos, privacidad, cambios/devoluciones, política de despacho y retiro en tienda."],
            ["Pendiente", "Pagos", "Completar datos bancarios definitivos para transferencia y credenciales productivas Webpay."],
            ["Pendiente", "QA móvil", "Probar en iPhone/Android reales: carrusel, checkout, teclado, scroll, botones fijos y carga de imágenes."],
            ["Pendiente", "Pedidos", "Definir estados finales: pendiente, pagado, preparado, entregado, cancelado, devuelto."],
            ["Pendiente", "Emails/WhatsApp", "Automatizar confirmación al cliente y alerta interna cuando entra pedido o pago aprobado."],
            ["Pendiente", "Deploy", "Subir cambios locales de transacciones/Webpay, validar build Vercel y probar con URL pública."],
        ],
        [1.05, 1.65, 4.1],
        status=True,
    ))

    story.append(p("6. Checklist de salida a producción", S["h1"]))
    for item in [
        "Build de Vercel sin errores y variables de entorno cargadas.",
        "Supabase actualizado con esquema de pagos y pedidos.",
        "Webpay probado con flujo aprobado, rechazado y cancelado.",
        "Pedido Webpay aprobado limpia carrito y aparece como pagado en admin.",
        "Pedido manual aparece con referencia y método correcto.",
        "Stock local no queda negativo tras pruebas.",
        "Bsale sigue sin recibir modificaciones desde la tienda.",
        "Administrador sabe revisar pedidos y pagos antes de preparar entrega.",
    ]:
        story.append(bullet(item))

    story.append(p("7. Glosario breve", S["h1"]))
    story.extend(grid_table(
        ["Concepto", "Significado"],
        [
            ["Supabase", "Base de datos de la tienda online."],
            ["Bsale", "Sistema externo de inventario/venta usado como fuente de sincronización."],
            ["Webpay", "Pasarela de pago de Transbank para tarjetas y Redcompra."],
            ["paymentStatus", "Estado interno del pago: pendiente, pagado, fallido, link pendiente, etc."],
            ["Referencia", "Código visible para ubicar operación/pedido, útil en transferencia o conciliación."],
        ],
        [1.55, 5.25],
    ))
    story.extend(callout("Recomendación final", "Antes de habilitar pagos reales, hacer una prueba acompañada con el administrador: crear pedido, pagar en Webpay integración, revisar admin, revisar Supabase y confirmar que el pedido queda claro para preparar entrega.", LIGHT_BLUE))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(PDF_PATH)


if __name__ == "__main__":
    build()
