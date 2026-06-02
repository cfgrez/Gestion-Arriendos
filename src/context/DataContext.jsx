import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as DB from '../db/db'
import { STORES } from '../db/db'
import { consultarUF, consultarUFActual } from '../utils/uf'
import { blobABase64, base64ABlob } from '../utils/helpers'

const DataContext = createContext(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}

const STORES_DATOS = [
  'propiedades',
  'arrendatarios',
  'contratos',
  'polizas',
  'ingresos',
  'gastos',
]

export function DataProvider({ children }) {
  const [cargando, setCargando] = useState(true)
  const [propiedades, setPropiedades] = useState([])
  const [arrendatarios, setArrendatarios] = useState([])
  const [contratos, setContratos] = useState([])
  const [polizas, setPolizas] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [gastos, setGastos] = useState([])
  const [avisoDias, setAvisoDias] = useState(60)
  const [ufCache, setUfCache] = useState({}) // { 'YYYY-MM-DD': valor }

  const setters = {
    propiedades: setPropiedades,
    arrendatarios: setArrendatarios,
    contratos: setContratos,
    polizas: setPolizas,
    ingresos: setIngresos,
    gastos: setGastos,
  }

  const recargar = useCallback(async (store) => {
    const datos = await DB.getAll(store)
    setters[store]?.(datos)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const [pr, ar, co, po, ing, ga] = await Promise.all(
          STORES_DATOS.map((s) => DB.getAll(s)),
        )
        setPropiedades(pr)
        setArrendatarios(ar)
        setContratos(co)
        setPolizas(po)
        setIngresos(ing)
        setGastos(ga)
        const dias = await DB.getConfig('avisoDias', 60)
        setAvisoDias(dias)
        const uf = await DB.getConfig('ufCache', {})
        setUfCache(uf || {})
      } catch (e) {
        console.error('Error al cargar datos', e)
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  const guardar = useCallback(
    async (store, item) => {
      await DB.put(store, item)
      await recargar(store)
      return item
    },
    [recargar],
  )

  const eliminar = useCallback(
    async (store, id) => {
      await DB.del(store, id)
      await recargar(store)
    },
    [recargar],
  )

  // ---- PDFs ----
  const guardarPDF = useCallback(async (id, nombre, blob) => {
    return DB.guardarPDF(id, nombre, blob)
  }, [])

  const abrirPDF = useCallback(async (id) => {
    const row = await DB.obtenerPDF(id)
    if (!row || !row.blob) {
      alert('No se encontró el PDF.')
      return
    }
    const url = URL.createObjectURL(row.blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }, [])

  const eliminarPDF = useCallback(async (id) => {
    if (id) await DB.eliminarPDF(id)
  }, [])

  // ---- Configuración ----
  const cambiarAvisoDias = useCallback(async (dias) => {
    setAvisoDias(dias)
    await DB.setConfig('avisoDias', dias)
  }, [])

  // ---- UF ----
  const guardarUF = useCallback(
    async (fechaISO, valor) => {
      const nuevo = { ...ufCache, [fechaISO]: Number(valor) }
      setUfCache(nuevo)
      await DB.setConfig('ufCache', nuevo)
    },
    [ufCache],
  )

  // Obtiene la UF de una fecha: primero caché, luego red, y la cachea.
  const obtenerUF = useCallback(
    async (fechaISO) => {
      if (ufCache[fechaISO]) return ufCache[fechaISO]
      const valor = await consultarUF(fechaISO)
      const nuevo = { ...ufCache, [fechaISO]: valor }
      setUfCache(nuevo)
      await DB.setConfig('ufCache', nuevo)
      return valor
    },
    [ufCache],
  )

  const refrescarUFActual = useCallback(async () => {
    const { valor, fecha } = await consultarUFActual()
    if (fecha) await guardarUF(fecha, valor)
    return { valor, fecha }
  }, [guardarUF])

  // ---- Respaldo / Restauración ----
  const exportarRespaldo = useCallback(async () => {
    const data = {}
    for (const s of STORES_DATOS) data[s] = await DB.getAll(s)
    data.config = { avisoDias, ufCache }
    // PDFs como base64
    const pdfs = await DB.getAll('pdfs')
    data.pdfs = []
    for (const p of pdfs) {
      const b64 = await blobABase64(p.blob)
      data.pdfs.push({ id: p.id, nombre: p.nombre, data: b64 })
    }
    data._meta = { app: 'gestion-arriendos', version: 1, fecha: new Date().toISOString() }
    return data
  }, [avisoDias, ufCache])

  const importarRespaldo = useCallback(async (data) => {
    if (!data || typeof data !== 'object') throw new Error('Archivo inválido')
    // Limpiar todo
    for (const s of Object.values(STORES)) await DB.clear(s)
    // Restaurar stores de datos
    for (const s of STORES_DATOS) {
      const arr = Array.isArray(data[s]) ? data[s] : []
      for (const item of arr) await DB.put(s, item)
    }
    // PDFs
    if (Array.isArray(data.pdfs)) {
      for (const p of data.pdfs) {
        if (p.data) {
          const blob = await base64ABlob(p.data)
          await DB.guardarPDF(p.id, p.nombre, blob)
        }
      }
    }
    // Config
    const cfg = data.config || {}
    await DB.setConfig('avisoDias', cfg.avisoDias ?? 60)
    await DB.setConfig('ufCache', cfg.ufCache ?? {})
    // Recargar estado
    await Promise.all(STORES_DATOS.map((s) => recargar(s)))
    setAvisoDias(cfg.avisoDias ?? 60)
    setUfCache(cfg.ufCache ?? {})
  }, [recargar])

  const borrarTodo = useCallback(async () => {
    for (const s of Object.values(STORES)) await DB.clear(s)
    await Promise.all(STORES_DATOS.map((s) => recargar(s)))
    setAvisoDias(60)
    setUfCache({})
    await DB.setConfig('avisoDias', 60)
    await DB.setConfig('ufCache', {})
  }, [recargar])

  const valor = {
    cargando,
    propiedades,
    arrendatarios,
    contratos,
    polizas,
    ingresos,
    gastos,
    avisoDias,
    ufCache,
    STORES,
    guardar,
    eliminar,
    guardarPDF,
    abrirPDF,
    eliminarPDF,
    cambiarAvisoDias,
    obtenerUF,
    guardarUF,
    refrescarUFActual,
    exportarRespaldo,
    importarRespaldo,
    borrarTodo,
  }

  return <DataContext.Provider value={valor}>{children}</DataContext.Provider>
}
