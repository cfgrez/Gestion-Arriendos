import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import { nuevoId, fmtCLP, fmtFecha, diasEntre, hoyISO } from '../utils/helpers'

const vacio = {
  compania: '', numero: '', rolId: '', inicio: '', termino: '',
  prima: '', pdfId: null, pdfNombre: '', notas: '',
}

export default function Polizas() {
  const { polizas, propiedades, guardar, eliminar, STORES, guardarPDF, abrirPDF, eliminarPDF } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)

  const rolTexto = (id) => {
    const p = propiedades.find((x) => x.id === id)
    return p ? `${p.rol} · ${p.direccion || ''}` : 'General'
  }

  const lista = useMemo(
    () => [...polizas].sort((a, b) => (a.termino || '').localeCompare(b.termino || '')),
    [polizas],
  )

  const guardarItem = async () => {
    if (!modal.compania?.trim()) return alert('Indica la compañía.')
    await guardar(STORES.polizas, {
      ...modal,
      prima: Number(modal.prima) || 0,
      id: modal.id || nuevoId(),
    })
    setModal(null)
  }
  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  const subirPDF = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const id = nuevoId()
    await guardarPDF(id, f.name, f)
    setModal((m) => ({ ...m, pdfId: id, pdfNombre: f.name }))
    e.target.value = ''
  }

  const estado = (p) => {
    if (!p.termino) return <Badge tipo="muted">Sin término</Badge>
    const d = diasEntre(hoyISO(), p.termino)
    if (d < 0) return <Badge tipo="danger">Vencida</Badge>
    if (d <= 60) return <Badge tipo="warn">Vence en {d}d</Badge>
    return <Badge tipo="ok">Vigente</Badge>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pólizas de seguro</h1>
          <p className="page-desc">Compañía, número, vigencia, prima y PDF.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ ...vacio })}>
          <Icon.Plus /> Nueva póliza
        </button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Icon.Shield width={34} height={34} />}
          titulo="Sin pólizas"
          texto="Registra las pólizas de seguro de tus propiedades."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Compañía</th>
                <th>N° póliza</th>
                <th>Propiedad</th>
                <th>Vigencia</th>
                <th className="num">Prima</th>
                <th>Estado</th>
                <th>PDF</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.compania}</td>
                  <td>{p.numero || '—'}</td>
                  <td>{p.rolId ? rolTexto(p.rolId) : 'General'}</td>
                  <td>{fmtFecha(p.inicio)} → {fmtFecha(p.termino)}</td>
                  <td className="num">{fmtCLP(p.prima)}</td>
                  <td>{estado(p)}</td>
                  <td>
                    {p.pdfId ? (
                      <button className="link" onClick={() => abrirPDF(p.pdfId)}>
                        <Icon.Eye width={15} height={15} /> Ver
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setModal({ ...p })} title="Editar">
                      <Icon.Edit />
                    </button>
                    <button className="icon-btn danger" onClick={() => setBorrar(p)} title="Eliminar">
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
          titulo={modal.id ? 'Editar póliza' : 'Nueva póliza'}
          onClose={() => setModal(null)}
          onGuardar={guardarItem}
        >
          <div className="grid2">
            <Field label="Compañía *">
              <input value={modal.compania} onChange={set('compania')} />
            </Field>
            <Field label="N° de póliza">
              <input value={modal.numero} onChange={set('numero')} />
            </Field>
            <Field label="Propiedad asociada" full>
              <select value={modal.rolId} onChange={set('rolId')}>
                <option value="">General / sin asociar</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>{p.rol} · {p.direccion}</option>
                ))}
              </select>
            </Field>
            <Field label="Inicio">
              <input type="date" value={modal.inicio} onChange={set('inicio')} />
            </Field>
            <Field label="Término">
              <input type="date" value={modal.termino} onChange={set('termino')} />
            </Field>
            <Field label="Prima (CLP)">
              <input type="number" value={modal.prima} onChange={set('prima')} />
            </Field>
            <Field label="PDF de la póliza">
              <div className="file-row">
                {modal.pdfId ? (
                  <>
                    <button type="button" className="link" onClick={() => abrirPDF(modal.pdfId)}>
                      <Icon.Eye width={15} height={15} /> {modal.pdfNombre || 'Ver'}
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
                    <Icon.Upload width={15} height={15} /> Subir PDF
                    <input type="file" accept="application/pdf" hidden onChange={subirPDF} />
                  </label>
                )}
              </div>
            </Field>
            <Field label="Notas" full>
              <textarea rows={2} value={modal.notas} onChange={set('notas')} />
            </Field>
          </div>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto={`¿Eliminar la póliza de "${borrar.compania}"?`}
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            if (borrar.pdfId) await eliminarPDF(borrar.pdfId)
            await eliminar(STORES.polizas, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
