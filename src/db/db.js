// Capa de acceso a IndexedDB (sin dependencias externas).

const DB_NAME = 'gestion-arriendos'
const DB_VERSION = 1

export const STORES = {
  propiedades: 'propiedades',
  arrendatarios: 'arrendatarios',
  contratos: 'contratos',
  polizas: 'polizas',
  ingresos: 'ingresos',
  gastos: 'gastos',
  pdfs: 'pdfs',
  config: 'config',
}

let _db = null

function abrir() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const keyPath = name === 'config' ? 'key' : 'id'
          db.createObjectStore(name, { keyPath })
        }
      }
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

function tx(store, modo, fn) {
  return abrir().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, modo)
        const os = t.objectStore(store)
        let resultado
        const r = fn(os)
        if (r) r.onsuccess = () => (resultado = r.result)
        t.oncomplete = () => resolve(resultado)
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
      }),
  )
}

export function getAll(store) {
  return tx(store, 'readonly', (os) => os.getAll())
}

export function getOne(store, id) {
  return tx(store, 'readonly', (os) => os.get(id))
}

export function put(store, valor) {
  return tx(store, 'readwrite', (os) => os.put(valor))
}

export function del(store, id) {
  return tx(store, 'readwrite', (os) => os.delete(id))
}

export function clear(store) {
  return tx(store, 'readwrite', (os) => os.clear())
}

// Config: pares clave/valor
export async function getConfig(key, porDefecto = null) {
  const row = await getOne(STORES.config, key)
  return row ? row.value : porDefecto
}

export function setConfig(key, value) {
  return put(STORES.config, { key, value })
}

// PDFs: se guardan como blobs
export async function guardarPDF(id, nombre, blob) {
  await put(STORES.pdfs, { id, nombre, blob })
  return id
}

export function obtenerPDF(id) {
  return getOne(STORES.pdfs, id)
}

export function eliminarPDF(id) {
  return del(STORES.pdfs, id)
}
