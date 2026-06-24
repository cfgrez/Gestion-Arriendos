import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import { fmtCLP, nuevoId } from '../utils/helpers'

const vacio = {
  rol: '', direccion: '', comuna: '', grupo: '', encargado: '',
  avaluo: '', contribucionAnual: '', destino: 'Habitacional', notas: '',
}

export default function Propiedades() {
  const { propiedades, contratos, gastos, ingresos, guardar, eliminar, STORES } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('todos')

  const grupos = useMemo(
    () => [...new Set(propiedades.map((p) => p.grupo).filter(Boolean))].sort(),
    [propiedades],
  )

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase()
    return propiedades
      .filter((p) => grupoFiltro === 'todos' || p.grupo === grupoFiltro)
      .filter(
        (p) =>
          !q ||
          p.rol?.toLowerCase().includes(q) ||
          p.direccion?.toLowerCase().includes(q) ||
          p.comuna?.toLowerCase().includes(q) ||
          p.encargado?.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.rol || '').localeCompare(b.rol || ''))
  }, [propiedades, busqueda, grupoFiltro])

  const contratoVigente = (rolId) =>
    contratos.find((c) => c.estado !== 'terminado' && (c.rolesIds || []).includes(rolId))

  const usado = (rolId) =>
    contratos.some((c) => (c.rolesIds || []).includes(rolId)) ||
    gastos.some((g) => g.rolId === rolId)

  const guardarItem = async () => {
    if (!modal.rol?.trim()) return alert('El número de rol es obligatorio.')
    await guardar(STORES.propiedades, {
      ...modal,
      avaluo: Number(modal.avaluo) || 0,
      contribucionAnual: Number(modal.contribucionAnual) || 0,
      id: modal.id || nuevoId(),
    })
    setModal(null)
  }

  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Propiedades y Roles</h1>
          <p className="page-desc">Direcciones, roles del SII, encargados, avalúo y contribuciones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ ...vacio })}>
          <Icon.Plus /> Nueva propiedad
        </button>
      </div>

      <div className="toolbar">
        <div className="search grow">
          <Icon.Search />
          <input
            placeholder="Buscar por rol, dirección, comuna o encargado…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="chips">
          <button
            className={'chip' + (grupoFiltro === 'todos' ? ' on' : '')}
            onClick={() => setGrupoFiltro('todos')}
          >
            Todos
          </button>
          {grupos.map((g) => (
            <button
              key={g}
              className={'chip' + (grupoFiltro === g ? ' on' : '')}
              onClick={() => setGrupoFiltro(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Icon.Building width={34} height={34} />}
          titulo="Sin propiedades"
          texto="Agrega tu primera propiedad para empezar a gestionar contratos e ingresos."
          accion={
            <button className="btn btn-primary" onClick={() => setModal({ ...vacio })}>
              <Icon.Plus /> Nueva propiedad
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rol SII</th>
                <th>Dirección</th>
                <th>Comuna</th>
                <th>Grupo</th>
                <th>Encargado</th>
                <th className="num">Contribución anual</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const cv = contratoVigente(p.id)
                return (
                  <tr key={p.id}>
                    <td className="strong">{p.rol}</td>
                    <td>{p.direccion || '—'}</td>
                    <td>{p.comuna || '—'}</td>
                    <td>{p.grupo ? <Badge>{p.grupo}</Badge> : '—'}</td>
                    <td>{p.encargado || '—'}</td>
                    <td className="num">{fmtCLP(p.contribucionAnual)}</td>
                    <td>
                      {cv ? <Badge tipo="ok">Arrendada</Badge> : <Badge tipo="muted">Disponible</Badge>}
                    </td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => setModal({ ...p })} title="Editar">
                        <Icon.Edit />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => setBorrar(p)}
                        title="Eliminar"
                      >
                        <Icon.Trash />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          titulo={modal.id ? 'Editar propiedad' : 'Nueva propiedad'}
          onClose={() => setModal(null)}
          onGuardar={guardarItem}
        >
          <div className="grid2">
            <Field label="Rol SII *">
              <input value={modal.rol} onChange={set('rol')} placeholder="12345-6" />
            </Field>
            <Field label="Grupo">
              <input value={modal.grupo} onChange={set('grupo')} placeholder="Ej: Edificio Centro" />
            </Field>
            <Field label="Dirección" full>
              <input value={modal.direccion} onChange={set('direccion')} />
            </Field>
            <Field label="Comuna">
              <input value={modal.comuna} onChange={set('comuna')} />
            </Field>
            <Field label="Encargado">
              <input value={modal.encargado} onChange={set('encargado')} />
            </Field>
            <Field label="Avalúo fiscal (CLP)">
              <input type="number" value={modal.avaluo} onChange={set('avaluo')} />
            </Field>
            <Field label="Contribución anual (CLP)">
              <input type="number" value={modal.contribucionAnual} onChange={set('contribucionAnual')} />
            </Field>
            <Field label="Destino">
              <select value={modal.destino} onChange={set('destino')}>
                <option>Habitacional</option>
                <option>Comercial</option>
                <option>Oficina</option>
                <option>Bodega</option>
                <option>Estacionamiento</option>
                <option>Terreno</option>
                <option>Otro</option>
              </select>
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
            usado(borrar.id)
              ? `La propiedad "${borrar.rol}" tiene contratos o gastos asociados. Si la eliminas, esos registros quedarán huérfanos.`
              : `¿Eliminar la propiedad "${borrar.rol}"?`
          }
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            await eliminar(STORES.propiedades, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
