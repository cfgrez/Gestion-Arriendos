import { useState, useRef } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, Field } from './UI'
import { descargarBlob, hoyISO, fmtFecha, fmtNum } from '../utils/helpers'

export default function Datos() {
  const {
    exportarRespaldo, importarRespaldo, borrarTodo,
    ufCache, guardarUF, refrescarUFActual,
    propiedades, arrendatarios, contratos, polizas, ingresos, gastos,
  } = useData()
  const [estado, setEstado] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [ufFecha, setUfFecha] = useState(hoyISO())
  const [ufValor, setUfValor] = useState('')
  const fileRef = useRef(null)

  const exportar = async () => {
    setEstado('Generando respaldo…')
    try {
      const data = await exportarRespaldo()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      descargarBlob(blob, `respaldo-arriendos-${hoyISO()}.json`)
      setEstado('Respaldo descargado correctamente.')
    } catch (e) {
      setEstado('Error al generar el respaldo: ' + e.message)
    }
  }

  const importar = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!confirm('Importar reemplazará TODOS los datos actuales por los del archivo. ¿Continuar?')) {
      e.target.value = ''
      return
    }
    setEstado('Importando…')
    try {
      const texto = await f.text()
      const data = JSON.parse(texto)
      await importarRespaldo(data)
      setEstado('Datos importados correctamente.')
    } catch (err) {
      setEstado('Error al importar: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  const guardarUFManual = async () => {
    if (!ufValor) return alert('Ingresa un valor de UF.')
    await guardarUF(ufFecha, Number(ufValor))
    setUfValor('')
    setEstado(`UF guardada para ${fmtFecha(ufFecha)}.`)
  }

  const traerUFActual = async () => {
    setEstado('Consultando UF actual…')
    try {
      const { valor, fecha } = await refrescarUFActual()
      setEstado(`UF de ${fmtFecha(fecha)}: ${fmtNum(valor, 2)}`)
    } catch (e) {
      setEstado('No se pudo consultar la UF: ' + e.message)
    }
  }

  const ufList = Object.entries(ufCache).sort((a, b) => b[0].localeCompare(a[0]))

  const conteos = [
    ['Propiedades', propiedades.length],
    ['Arrendatarios', arrendatarios.length],
    ['Contratos', contratos.length],
    ['Pólizas', polizas.length],
    ['Ingresos', ingresos.length],
    ['Gastos', gastos.length],
  ]

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Datos y respaldo</h1>
          <p className="page-desc">Tus datos viven solo en este navegador. Respáldalos con frecuencia.</p>
        </div>
      </div>

      <div className="panel-section">
        <h2><Icon.Database width={18} height={18} /> Resumen de datos</h2>
        <div className="conteo-grid">
          {conteos.map(([l, n]) => (
            <div className="conteo" key={l}>
              <span className="conteo-val">{n}</span>
              <span className="conteo-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h2><Icon.Download width={18} height={18} /> Respaldo y restauración</h2>
        <p className="muted">El respaldo incluye todos los registros y los PDF subidos, en un solo archivo JSON.</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={exportar}>
            <Icon.Download width={16} height={16} /> Exportar respaldo (JSON)
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Icon.Upload width={16} height={16} /> Importar respaldo
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importar} />
        </div>
      </div>

      <div className="panel-section">
        <h2><Icon.Cash width={18} height={18} /> Valor de la UF</h2>
        <p className="muted">
          Los contratos en UF se valorizan automáticamente al registrar el pago. Aquí puedes guardar valores manualmente o traer el más reciente.
        </p>
        <div className="uf-manual">
          <Field label="Fecha">
            <input type="date" value={ufFecha} onChange={(e) => setUfFecha(e.target.value)} />
          </Field>
          <Field label="Valor UF (CLP)">
            <input type="number" step="any" value={ufValor} onChange={(e) => setUfValor(e.target.value)} placeholder="Ej: 38123.45" />
          </Field>
          <button className="btn btn-ghost" onClick={guardarUFManual}>Guardar</button>
          <button className="btn btn-ghost" onClick={traerUFActual}>
            <Icon.Refresh width={15} height={15} /> Traer UF actual
          </button>
        </div>
        {ufList.length > 0 && (
          <div className="uf-cache">
            <span className="muted small">Valores guardados:</span>
            <div className="uf-tags">
              {ufList.slice(0, 12).map(([f, v]) => (
                <span className="uf-tag" key={f}>{fmtFecha(f)}: {fmtNum(v, 2)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel-section danger-zone">
        <h2><Icon.Alert width={18} height={18} /> Zona de riesgo</h2>
        <p className="muted">Elimina permanentemente todos los datos de este navegador.</p>
        <button className="btn btn-danger" onClick={() => setConfirmar(true)}>
          <Icon.Trash width={16} height={16} /> Borrar todos los datos
        </button>
      </div>

      {estado && <div className="toast">{estado}</div>}

      {confirmar && (
        <Modal titulo="Borrar todos los datos" onClose={() => setConfirmar(false)} ancho={420}>
          <p className="confirm-text">Se eliminarán todas las propiedades, contratos, ingresos, gastos, pólizas y PDFs.</p>
          <p className="confirm-warn">Esta acción no se puede deshacer. Asegúrate de tener un respaldo.</p>
          <div className="modal-foot" style={{ marginTop: 18, border: 'none' }}>
            <button className="btn btn-ghost" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                await borrarTodo()
                setConfirmar(false)
                setEstado('Todos los datos fueron eliminados.')
              }}
            >
              Sí, borrar todo
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
