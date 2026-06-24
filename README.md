# Gestión de Arriendos

Aplicación web para administrar propiedades en arriendo en Chile: roles del SII, arrendatarios, contratos (con PDF), pólizas de seguro, ingresos valorizados en UF, gastos, avisos de vencimiento y reportes de morosidad y rentabilidad.

Construida con **React + Vite**. Es una aplicación 100% del lado del cliente: **todos los datos se guardan localmente en el navegador** (IndexedDB), incluidos los PDF. No hay servidor ni base de datos externa.

> ⚠️ **Importante sobre los datos:** como la información vive en el navegador, *no* se sincroniza entre equipos ni navegadores, y se puede perder si borras los datos del sitio. Usa con frecuencia **Datos y respaldo → Exportar respaldo (JSON)** para tener una copia, y **Importar** para restaurarla o moverla a otro equipo.

---

## Desarrollo local

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abre la URL que muestra la consola (por defecto `http://localhost:5173`).

Para generar la versión de producción:

```bash
npm run build      # genera la carpeta dist/
npm run preview    # previsualiza el resultado del build
```

---

## Despliegue en Cloudflare Pages

Esta app es un sitio estático con enrutamiento del lado del cliente. Se incluyen dos archivos para cubrir ambos modos de despliegue de Cloudflare:

- `public/_redirects` → para proyectos creados como **Cloudflare Pages**.
- `wrangler.jsonc` → para proyectos creados como **Workers** (sirve `dist/` como assets con fallback de página única). Si tu proyecto se desplegó como Worker y el deploy ejecuta `npx wrangler deploy`, este archivo es el que evita el error "The version of Vite cannot be automatically configured".

### Opción A — Conectado a GitHub (recomendado)

1. Sube **todo** el contenido de este proyecto a tu repositorio de GitHub (incluyendo la carpeta `src/` completa). No subas `node_modules/` ni `dist/`; el `.gitignore` ya los excluye.
2. En el panel de Cloudflare ve a **Workers & Pages → Create → Pages → Connect to Git** y elige el repositorio.
3. Configura el build así:
   - **Framework preset:** `Vite` (o "None")
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Guarda y despliega. En cada `git push` Cloudflare reconstruye y publica automáticamente.

> La causa más común de "página en blanco" es que el **Build output directory** no sea `dist`, o que la carpeta `src/` no se haya subido completa al repositorio. Verifica ambos.

### Opción B — Wrangler CLI (sin GitHub)

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name=gestion-arriendos
```

---

## Estructura del proyecto

```
public/
  _redirects        # Redirección SPA para Cloudflare Pages
  favicon.svg
src/
  db/db.js          # Capa de acceso a IndexedDB
  context/          # Estado global (DataContext)
  utils/            # Helpers de formato, fechas, CSV y consulta de UF
  components/       # Páginas y componentes de interfaz
  App.jsx           # Layout y navegación
  main.jsx          # Punto de entrada
  index.css         # Estilos
index.html
vite.config.js      # base: './' para rutas relativas (Cloudflare)
```

## Valor de la UF

Los contratos en UF se valorizan automáticamente al registrar un pago, consultando el valor del día en `mindicador.cl`. Si no hay conexión o el servicio no responde, puedes ingresar el valor a mano en el formulario de ingreso o en **Datos y respaldo → Valor de la UF**. Los valores consultados quedan guardados en caché local.
