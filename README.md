# 💧 Limpieza Willi - Sistema de Control de Ventas, Gastos y Preparados

Sistema súper visual y táctil diseñado especialmente para celulares, pensado para el negocio de fraccionamiento, elaboración artesanal y reventa de productos de limpieza.

---

## 🚀 ¿Cómo probarlo ahora en tu compu o celular?

### 1. Iniciar en modo desarrollo
Abrí una terminal en esta carpeta (`D:\limpieza-willi`) y ejecutá:

```bash
npm run dev -- --host
```

Vite te mostrará dos enlaces:
- **Local:** `http://localhost:5173/` (para abrirlo en tu navegador de la compu).
- **Network:** `http://192.168.x.x:5173/` (¡para abrirlo en el **celular** conectado al mismo WiFi!).

---

## 📱 ¿Cómo instalarlo como App en el celular de Willi?

La aplicación está preparada como **PWA (Progressive Web App)**:
1. Abrí el enlace en **Google Chrome** (Android) o **Safari** (iPhone).
2. Tocá los **tres puntitos** arriba a la derecha (o el botón compartir en iPhone).
3. Seleccioná **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
4. ¡Listo! Le queda el ícono en la pantalla de inicio y se abre a pantalla completa como una app nativa, sin barras de navegación.

---

## 🌟 Funcionalidades Clave

### 1. 🧪 Calculadora de Preparados (La cuenta del WhatsApp)
- Diseñada directamente con el ejemplo real de Willi:
  - **30 Litros de Cloro Puro concentrado a $18.000**.
  - **Rinde 50 Litros de Lavandina**.
  - **Venta a $1.500 el litro**.
  - **Resultado en vivo:** Costo real por litro ($360/L), Venta total ($75.000), **Ganancia Limpia ($57.000)** y Margen (+316%).
- Botones rápidos: *"Registrar compra como Gasto"*, *"Guardar en Catálogo"* y *"Guardar en Mis Recetas"*.

### 2. 📊 Tablero Principal (Ganancia Neta en Bolsillo)
- Número gigante en verde con la ganancia neta real en mano.
- Filtros rápidos por período: **Hoy**, **7 Días**, **Este Mes**, **Todo**.
- Desglose de **Efectivo Físico** vs **Transferencias / MercadoPago**.
- Alerta visual si tiene clientes que le deben plata (fiados).

### 3. 💰 Registro Rápido de Ventas (+ Ingreso)
- Botones de 1 toque con productos frecuentes (Lavandina 1L, Bidón 5L, Detergente, etc.).
- Stepper grande `+` y `-` para elegir cantidad con el pulgar.
- Métodos de pago: Efectivo, Transferencia o Fiado.

### 4. 🧾 Registro de Gastos (- Egreso)
- Categorías con iconos: Químicos/Materia Prima, Bidones y Tapas, Nafta/Flete, Etiquetas y Varios.
- Sugerencias con 1 toque.

### 5. 👥 Fiados y Cobranzas (Plata en la calle)
- Control de clientes que compraron y quedaron debiendo.
- Botón **"Marcar Cobrado"** en un toque (pasa automáticamente a ser un ingreso cobrado).
- Botón de **WhatsApp** para mandarle un mensaje recordatorio amigable y automático al cliente.

### 6. 📋 Catálogo de Productos y Precios
- Lista de productos con su costo de elaboración, precio de venta, ganancia neta por unidad y margen porcentual.
- Edición rápida de precios sin vueltas.

### 7. 💾 Copias de Seguridad y Reporte WhatsApp
- Generador de mensaje de texto listo para mandar por WhatsApp con el balance del día.
- Descarga de respaldo en archivo `.json` y restauración en 1 clic.
- Funciona 100% offline (sin necesidad de internet, los datos se guardan en la memoria del teléfono).

---

## 🌐 ¿Cómo subirlo a internet para que Willi lo use siempre gratis?

Podés publicarlo en 1 minuto en plataformas gratuitas como **Vercel** o **Netlify**:

### Opción Vercel (Recomendada):
1. Subí esta carpeta a GitHub.
2. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con GitHub.
3. Importá el repositorio `limpieza-willi` y dale a **Deploy**.
4. Te dará un enlace tipo `https://limpieza-willi.vercel.app` para pasárselo por WhatsApp a Willi.
