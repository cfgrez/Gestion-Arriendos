// Utilidades generales

export function nuevoId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function fmtCLP(n) {
  const v = Number(n)
  if (!isFinite(v)) return '$0'
  return clp.format(Math.round(v))
}

export function fmtUF(n) {
  const v = Number(n)
  if (!isFinite(v)) return '0 UF'
  return v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' UF'
}

export function fmtNum(n, dec = 2) {
  const v = Number(n)
  if (!isFinite(v)) return '0'
  return v.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// Fechas (trabajamos con strings YYYY-MM-DD)
export function hoyISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}-${m}-${y}`
}

export function diasEntre(desdeISO, hastaISO) {
  if (!desdeISO || !hastaISO) return null
  const a = new Date(desdeISO + 'T00:00:00')
  const b = new Date(hastaISO + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

// Periodo de un ingreso: 'YYYY-MM'
export function fmtPeriodo(periodo) {
  if (!periodo) return '—'
  const [y, m] = periodo.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const idx = parseInt(m, 10) - 1
  return `${meses[idx] || m} ${y}`
}

export function periodoActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Genera N periodos hacia atrás desde el actual (incluyéndolo)
export function periodosRecientes(n = 24) {
  const out = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

// Exportar arreglo de objetos a CSV y descargar
export function descargarCSV(nombre, filas) {
  if (!filas || filas.length === 0) {
    alert('No hay datos para exportar.')
    return
  }
  const cols = Object.keys(filas[0])
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const lineas = [cols.join(';')]
  for (const f of filas) lineas.push(cols.map((c) => escape(f[c])).join(';'))
  // BOM para que Excel reconozca acentos
  const blob = new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8;' })
  descargarBlob(blob, nombre)
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Conversión blob <-> base64 (para respaldo JSON con PDFs)
export function blobABase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result) // dataURL completa
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

export async function base64ABlob(dataURL) {
  const resp = await fetch(dataURL)
  return await resp.blob()
}
