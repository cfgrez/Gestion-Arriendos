import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import { nuevoId, fmtCLP, fmtFecha, hoyISO, descargarCSV } from '../utils/helpers'

const TIPOS = ['Contribuciones', 'Mantención', 'Servicios', 'Gastos comunes', 'Reparación', 'Administración', 'Otro']
const vacio = { rolId: '', tipo: 'Mantención', fecha: '', monto: '', descripcion: '' }

export default function Gastos() {
  const { gastos, propiedades, guardar, eliminar, STORES } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const [rolFiltro, setRolFiltro] = useState('todos')

  const rolTexto = (id) => {
    const p = propiedades.find((x) => x.id === id)
    return p ? `${p.rol} · ${p.direccion || ''}` : '(rol eliminado)'
  }

  const lista = useMemo(() => {
    return gastos
      .filter((g) => rolFiltro === 'todos' || g.rolId === rolFiltro)
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  }, [gastos, rolFiltro])

  const total = useMemo(() => lista.reduce((s, g) => s + (Number(g.monto) || 0), 0), [lista])

  const guardarItem = async () => {
    if (!modal.rolId) return alert('Selecciona una propiedad.')
    if (!modal.monto) return alert('Indica el monto.')
    await guardar(STORES.gastos, { ...modal, monto: Number(modal.monto) || 0, id: modal.id || nuevoId() })
    setModal(null)
  }
  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  const exportar = () => {
    descargarCSV(
      'gastos.csv',
      lista.map((g) => ({
        Rol: propiedades.find((p) => p.id === g.rolId)?.rol || '',
        Direccion: propiedades.find((p) => p.id === g.rolId)?.direccion || '',
        Tipo: g.tipo,
        Fecha: g.fecha,
        Monto: g.monto,
        Descripcion: g.descripcion || '',
      })),
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-desc">Contribuciones, mantención, servicios y otros, asociados a cada rol.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportar}>
            <Icon.Download width={16} height={16} /> CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!propiedades.length) return alert('Primero crea al menos una propiedad.')
              setModal({ ...vacio, fecha: hoyISO() })
            }}
          >
            <Icon.Plus /> Nuevo gasto
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="chips">
          <button className={'chip' + (rolFiltro === 'todos' ? ' on' : '')} onClick={() => setRolFiltro('todos')}>
            Todos los roles
          </button>
          {propiedades.map((p) => (
            <button key={p.id} className={'chip' + (rolFiltro === p.id ? ' on' : '')} onClick={() => setRolFiltro(p.id)}>
              {p.rol}
            </button>
          ))}
        </div>
        <div className="total-pill">Total: {fmtCLP(total)}</div>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={<Icon.Receipt width={34} height={34} />} titulo="Sin gastos" texto="Registra los gastos de tus propiedades." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Propiedad</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th className="num">Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((g) => (
                <tr key={g.id}>
                  <td>{fmtFecha(g.fecha)}</td>
                  <td>{rolTexto(g.rolId)}</td>
                  <td><Badge tipo="muted">{g.tipo}</Badge></td>
                  <td>{g.descripcion || '—'}</td>
                  <td className="num">{fmtCLP(g.monto)}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setModal({ ...g })} title="Editar">
                      <Icon.Edit />
                    </button>
                    <button className="icon-btn danger" onClick={() => setBorrar(g)} title="Eliminar">
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
        <Modal titulo={modal.id ? 'Editar gasto' : 'Nuevo gasto'} onClose={() => setModal(null)} onGuardar={guardarItem}>
          <div className="grid2">
            <Field label="Propiedad (rol) *" full>
              <select value={modal.rolId} onChange={set('rolId')}>
                <option value="">— Selecciona —</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>{p.rol} · {p.direccion}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={modal.tipo} onChange={set('tipo')}>
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Fecha">
              <input type="date" value={modal.fecha} onChange={set('fecha')} />
            </Field>
            <Field label="Monto (CLP) *">
              <input type="number" value={modal.monto} onChange={set('monto')} />
            </Field>
            <Field label="Descripción" full>
              <input value={modal.descripcion} onChange={set('descripcion')} />
            </Field>
          </div>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto={`¿Eliminar este gasto de ${fmtCLP(borrar.monto)}?`}
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            await eliminar(STORES.gastos, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
