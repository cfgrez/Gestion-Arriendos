import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import { nuevoId } from '../utils/helpers'

const vacio = { tipo: 'Persona', nombre: '', rut: '', email: '', telefono: '', notas: '' }

export default function Arrendatarios() {
  const { arrendatarios, contratos, guardar, eliminar, STORES } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase()
    return arrendatarios
      .filter(
        (a) =>
          !q ||
          a.nombre?.toLowerCase().includes(q) ||
          a.rut?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  }, [arrendatarios, busqueda])

  const contratosDe = (id) => contratos.filter((c) => c.arrendatarioId === id).length

  const guardarItem = async () => {
    if (!modal.nombre?.trim()) return alert('El nombre o razón social es obligatorio.')
    await guardar(STORES.arrendatarios, { ...modal, id: modal.id || nuevoId() })
    setModal(null)
  }
  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Arrendatarios</h1>
          <p className="page-desc">Personas o empresas con sus datos de contacto.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ ...vacio })}>
          <Icon.Plus /> Nuevo arrendatario
        </button>
      </div>

      <div className="toolbar">
        <div className="search grow">
          <Icon.Search />
          <input
            placeholder="Buscar por nombre, RUT o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Icon.Users width={34} height={34} />}
          titulo="Sin arrendatarios"
          texto="Registra a quienes arriendan tus propiedades."
          accion={
            <button className="btn btn-primary" onClick={() => setModal({ ...vacio })}>
              <Icon.Plus /> Nuevo arrendatario
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre / Razón social</th>
                <th>Tipo</th>
                <th>RUT</th>
                <th>Contacto</th>
                <th className="num">Contratos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id}>
                  <td className="strong">{a.nombre}</td>
                  <td><Badge tipo="muted">{a.tipo}</Badge></td>
                  <td>{a.rut || '—'}</td>
                  <td>
                    {a.email || a.telefono ? (
                      <span className="contacto">
                        {a.email && <span>{a.email}</span>}
                        {a.telefono && <span>{a.telefono}</span>}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="num">{contratosDe(a.id)}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setModal({ ...a })} title="Editar">
                      <Icon.Edit />
                    </button>
                    <button className="icon-btn danger" onClick={() => setBorrar(a)} title="Eliminar">
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
          titulo={modal.id ? 'Editar arrendatario' : 'Nuevo arrendatario'}
          onClose={() => setModal(null)}
          onGuardar={guardarItem}
        >
          <div className="grid2">
            <Field label="Tipo">
              <select value={modal.tipo} onChange={set('tipo')}>
                <option>Persona</option>
                <option>Empresa</option>
              </select>
            </Field>
            <Field label="RUT">
              <input value={modal.rut} onChange={set('rut')} placeholder="12.345.678-9" />
            </Field>
            <Field label={modal.tipo === 'Empresa' ? 'Razón social *' : 'Nombre *'} full>
              <input value={modal.nombre} onChange={set('nombre')} />
            </Field>
            <Field label="Email">
              <input value={modal.email} onChange={set('email')} />
            </Field>
            <Field label="Teléfono">
              <input value={modal.telefono} onChange={set('telefono')} />
            </Field>
            <Field label="Notas" full>
              <textarea rows={2} value={modal.notas} onChange={set('notas')} />
            </Field>
          </div>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto={
            contratosDe(borrar.id) > 0
              ? `"${borrar.nombre}" tiene ${contratosDe(borrar.id)} contrato(s) asociado(s). Si lo eliminas, esos contratos quedarán sin arrendatario.`
              : `¿Eliminar al arrendatario "${borrar.nombre}"?`
          }
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            await eliminar(STORES.arrendatarios, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
