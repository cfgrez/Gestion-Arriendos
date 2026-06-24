import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field } from './UI'
import { nuevoId, fmtCLP, fmtUF, fmtFecha } from '../utils/helpers'

const vacio = {
  rolIds: [], precio: '', moneda: 'CLP', fecha: '',
  fojas: '', numero: '', anio: '', conservador: '',
  contraparte: '', pdfId: null, pdfNombre: '', notas: '',
}

export default function Compraventas() {
  const {
    compraventas, propiedades, guardar, eliminar, STORES,
    guardarPDF, abrirPDF, eliminarPDF,
  } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)

  const rolTexto = (id) => {
    const p = propiedades.find((x) => x.id === id)
    return p ? `${p.rol}${p.direccion ? ' · ' + p.direccion : ''}` : '(rol eliminado)'
  }

  const lista = useMemo(
    () => [...compraventas].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')),
    [compraventas],
  )

  const inscripcion = (c) => {
    const partes = []
    if (c.fojas) partes.push(`Fojas ${c.fojas}`)
    if (c.numero) partes.push(`N° ${c.numero}`)
    if (c.anio) partes.push(c.anio)
    return partes.length ? partes.join(' · ') : '—'
  }

  const toggleRol = (rolId) => {
    setModal((m) => {
      const actuales = m.rolIds || []
      const tiene = actuales.includes(rolId)
      return { ...m, rolIds: tiene ? actuales.filter((r) => r !== rolId) : [...actuales, rolId] }
    })
  }

  const guardarItem = async () => {
    if (!modal.rolIds?.length) return alert('Selecciona al menos una propiedad (rol).')
    if (!modal.fecha) return alert('Indica la fecha de la compraventa.')
    await guardar(STORES.compraventas, {
      ...modal,
      precio: Number(modal.precio) || 0,
      id: modal.id || nuevoId(),
    })
    setModal(null)
  }

  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  const subirEscritura = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const id = nuevoId()
    await guardarPDF(id, f.name, f)
    setModal((m) => ({ ...m, pdfId: id, pdfNombre: f.name }))
    e.target.value = ''
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Compraventas</h1>
          <p className="page-desc">
            Precio, fecha, datos de inscripción (fojas), roles y PDF de la escritura.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!propiedades.length) return alert('Primero crea al menos una propiedad.')
            setModal({ ...vacio })
          }}
        >
          <Icon.Plus /> Nueva compraventa
        </button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Icon.Key width={34} height={34} />}
          titulo="Sin compraventas"
          texto="Registra las compraventas de tus propiedades con su escritura."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Propiedad(es)</th>
                <th>Fecha</th>
                <th className="num">Precio</th>
                <th>Inscripción</th>
                <th>Contraparte</th>
                <th>Escritura</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className="strong">
                    {(c.rolIds || []).length === 0
                      ? '—'
                      : (c.rolIds || []).map((r) => <div key={r}>{rolTexto(r)}</div>)}
                  </td>
                  <td>{fmtFecha(c.fecha)}</td>
                  <td className="num">{c.moneda === 'UF' ? fmtUF(c.precio) : fmtCLP(c.precio)}</td>
                  <td>{inscripcion(c)}</td>
                  <td>{c.contraparte || '—'}</td>
                  <td>
                    {c.pdfId ? (
                      <button className="link" onClick={() => abrirPDF(c.pdfId)}>
                        <Icon.Eye width={15} height={15} /> Ver
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setModal({ ...c, rolIds: c.rolIds || [] })} title="Editar">
                      <Icon.Edit />
                    </button>
                    <button className="icon-btn danger" onClick={() => setBorrar(c)} title="Eliminar">
                      <Icon.Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          titulo={modal.id ? 'Editar compraventa' : 'Nueva compraventa'}
          onClose={() => setModal(null)}
          onGuardar={guardarItem}
          ancho={680}
        >
          <Field label="Propiedades incluidas (roles) *" full>
            <div className="rol-picker">
              {propiedades.length === 0 && <p className="muted">No hay propiedades.</p>}
              {propiedades.map((p) => {
                const seleccionado = (modal.rolIds || []).includes(p.id)
                return (
                  <label key={p.id} className={'rol-opt' + (seleccionado ? ' on' : '')}>
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={() => toggleRol(p.id)}
                    />
                    <span>
                      <strong>{p.rol}</strong> {p.direccion}
                    </span>
                  </label>
                )
              })}
            </div>
          </Field>

          <div className="grid2">
            <Field label="Fecha de compraventa *">
              <input type="date" value={modal.fecha} onChange={set('fecha')} />
            </Field>
            <Field label="Contraparte" hint="Vendedor o comprador">
              <input value={modal.contraparte} onChange={set('contraparte')} />
            </Field>
            <Field label="Moneda del precio">
              <select value={modal.moneda} onChange={set('moneda')}>
                <option value="CLP">Pesos (CLP)</option>
                <option value="UF">UF</option>
              </select>
            </Field>
            <Field label={modal.moneda === 'UF' ? 'Precio (UF)' : 'Precio (CLP)'}>
              <input type="number" step="any" value={modal.precio} onChange={set('precio')} />
            </Field>
          </div>

          <div className="grid2">
            <Field label="Fojas">
              <input value={modal.fojas} onChange={set('fojas')} placeholder="Ej: 1234" />
            </Field>
            <Field label="N° de inscripción">
              <input value={modal.numero} onChange={set('numero')} placeholder="Ej: 567" />
            </Field>
            <Field label="Año">
              <input value={modal.anio} onChange={set('anio')} placeholder="Ej: 2024" />
            </Field>
            <Field label="Conservador de Bienes Raíces">
              <input value={modal.conservador} onChange={set('conservador')} placeholder="Ej: Santiago" />
            </Field>
          </div>

          <Field label="Escritura de compraventa (PDF)" full>
            <div className="file-row">
              {modal.pdfId ? (
                <>
                  <button type="button" className="link" onClick={() => abrirPDF(modal.pdfId)}>
                    <Icon.Eye width={15} height={15} /> {modal.pdfNombre || 'Ver escritura'}
                  </button>
                  <button
                    type="button"
                    className="link danger"
                    onClick={async () => {
                      await eliminarPDF(modal.pdfId)
                      setModal((m) => ({ ...m, pdfId: null, pdfNombre: '' }))
                    }}
                  >
                    Quitar
                  </button>
                </>
              ) : (
                <label className="btn btn-ghost btn-sm">
                  <Icon.Upload width={15} height={15} /> Subir escritura
                  <input type="file" accept="application/pdf" hidden onChange={subirEscritura} />
                </label>
              )}
            </div>
          </Field>

          <Field label="Notas" full>
            <textarea rows={2} value={modal.notas} onChange={set('notas')} />
          </Field>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto="¿Eliminar esta compraventa? También se quitará el PDF de la escritura."
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            if (borrar.pdfId) await eliminarPDF(borrar.pdfId)
            await eliminar(STORES.compraventas, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
