import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import { nuevoId, fmtCLP, fmtUF, fmtFecha, diasEntre, hoyISO } from '../utils/helpers'

const vacio = {
  arrendatarioId: '', rolesIds: [], inicio: '', termino: '',
  monto: '', moneda: 'CLP', diaPago: 5, reajuste: 'Anual IPC',
  garantia: '', estado: 'vigente', notas: '',
  contratoPdfId: null, contratoPdfNombre: '', anexos: [],
}

export default function Contratos() {
  const {
    contratos, arrendatarios, propiedades, guardar, eliminar, STORES,
    guardarPDF, abrirPDF, eliminarPDF,
  } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const nombreArr = (id) => arrendatarios.find((a) => a.id === id)?.nombre || '—'
  const rolTexto = (id) => {
    const p = propiedades.find((x) => x.id === id)
    return p ? `${p.rol}${p.direccion ? ' · ' + p.direccion : ''}` : '(rol eliminado)'
  }

  // Roles ya ocupados por OTRO contrato vigente
  const rolesOcupados = useMemo(() => {
    const set = {}
    for (const c of contratos) {
      if (c.estado === 'terminado') continue
      for (const r of c.rolesIds || []) set[r] = c.id
    }
    return set
  }, [contratos])

  const lista = useMemo(() => {
    return contratos
      .filter((c) => filtroEstado === 'todos' || c.estado === filtroEstado)
      .sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''))
  }, [contratos, filtroEstado])

  const guardarItem = async () => {
    if (!modal.arrendatarioId) return alert('Selecciona un arrendatario.')
    if (!modal.rolesIds.length) return alert('Selecciona al menos una propiedad (rol).')
    if (!modal.inicio) return alert('Indica la fecha de inicio.')
    await guardar(STORES.contratos, {
      ...modal,
      monto: Number(modal.monto) || 0,
      garantia: Number(modal.garantia) || 0,
      diaPago: Number(modal.diaPago) || 1,
      id: modal.id || nuevoId(),
    })
    setModal(null)
  }

  const set = (k) => (e) => setModal((m) => ({ ...m, [k]: e.target.value }))

  const toggleRol = (rolId) => {
    setModal((m) => {
      const tiene = m.rolesIds.includes(rolId)
      return { ...m, rolesIds: tiene ? m.rolesIds.filter((r) => r !== rolId) : [...m.rolesIds, rolId] }
    })
  }

  const subirContrato = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const id = nuevoId()
    await guardarPDF(id, f.name, f)
    setModal((m) => ({ ...m, contratoPdfId: id, contratoPdfNombre: f.name }))
    e.target.value = ''
  }

  const subirAnexo = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const id = nuevoId()
    await guardarPDF(id, f.name, f)
    setModal((m) => ({ ...m, anexos: [...(m.anexos || []), { id, nombre: f.name }] }))
    e.target.value = ''
  }

  const quitarAnexo = async (id) => {
    await eliminarPDF(id)
    setModal((m) => ({ ...m, anexos: m.anexos.filter((a) => a.id !== id) }))
  }

  const estadoVigencia = (c) => {
    if (c.estado === 'terminado') return <Badge tipo="muted">Terminado</Badge>
    if (!c.termino) return <Badge tipo="ok">Vigente</Badge>
    const d = diasEntre(hoyISO(), c.termino)
    if (d < 0) return <Badge tipo="danger">Vencido</Badge>
    if (d <= 60) return <Badge tipo="warn">Vence en {d}d</Badge>
    return <Badge tipo="ok">Vigente</Badge>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-desc">
            Un contrato puede agrupar varios roles para un mismo arrendatario. Sube contrato y anexos en PDF.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!arrendatarios.length) return alert('Primero crea al menos un arrendatario.')
            if (!propiedades.length) return alert('Primero crea al menos una propiedad.')
            setModal({ ...vacio, inicio: hoyISO() })
          }}
        >
          <Icon.Plus /> Nuevo contrato
        </button>
      </div>

      <div className="toolbar">
        <div className="chips">
          {['todos', 'vigente', 'terminado'].map((e) => (
            <button
              key={e}
              className={'chip' + (filtroEstado === e ? ' on' : '')}
              onClick={() => setFiltroEstado(e)}
            >
              {e === 'todos' ? 'Todos' : e === 'vigente' ? 'Vigentes' : 'Terminados'}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Icon.Doc width={34} height={34} />}
          titulo="Sin contratos"
          texto="Crea un contrato para asociar propiedades con arrendatarios."
        />
      ) : (
        <div className="cards">
          {lista.map((c) => (
            <div className="card" key={c.id}>
              <div className="card-top">
                <div>
                  <h3>{nombreArr(c.arrendatarioId)}</h3>
                  <div className="card-sub">
                    {(c.rolesIds || []).length} {(c.rolesIds || []).length === 1 ? 'rol' : 'roles'} ·{' '}
                    {c.moneda === 'UF' ? fmtUF(c.monto) : fmtCLP(c.monto)} / mes
                  </div>
                </div>
                {estadoVigencia(c)}
              </div>

              <ul className="roles-list">
                {(c.rolesIds || []).map((r) => (
                  <li key={r}>{rolTexto(r)}</li>
                ))}
              </ul>

              <div className="card-meta">
                <span>Vigencia: {fmtFecha(c.inicio)} → {c.termino ? fmtFecha(c.termino) : 'indefinido'}</span>
                <span>Día de pago: {c.diaPago}</span>
                {c.reajuste && <span>Reajuste: {c.reajuste}</span>}
                {c.garantia > 0 && <span>Garantía: {fmtCLP(c.garantia)}</span>}
              </div>

              <div className="card-foot">
                <div className="pdf-links">
                  {c.contratoPdfId && (
                    <button className="link" onClick={() => abrirPDF(c.contratoPdfId)}>
                      <Icon.Eye width={15} height={15} /> Contrato PDF
                    </button>
                  )}
                  {(c.anexos || []).map((a) => (
                    <button key={a.id} className="link" onClick={() => abrirPDF(a.id)}>
                      <Icon.Eye width={15} height={15} /> {a.nombre}
                    </button>
                  ))}
                </div>
                <div className="actions">
                  <button className="icon-btn" onClick={() => setModal({ ...c, anexos: c.anexos || [] })} title="Editar">
                    <Icon.Edit />
                  </button>
                  <button className="icon-btn danger" onClick={() => setBorrar(c)} title="Eliminar">
                    <Icon.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          titulo={modal.id ? 'Editar contrato' : 'Nuevo contrato'}
          onClose={() => setModal(null)}
          onGuardar={guardarItem}
          ancho={680}
        >
          <div className="grid2">
            <Field label="Arrendatario *">
              <select value={modal.arrendatarioId} onChange={set('arrendatarioId')}>
                <option value="">— Selecciona —</option>
                {arrendatarios.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={modal.estado} onChange={set('estado')}>
                <option value="vigente">Vigente</option>
                <option value="terminado">Terminado</option>
              </select>
            </Field>
          </div>

          <Field label="Propiedades incluidas (roles) *" full>
            <div className="rol-picker">
              {propiedades.length === 0 && <p className="muted">No hay propiedades.</p>}
              {propiedades.map((p) => {
                const ocupadoPor = rolesOcupados[p.id]
                const ocupadoOtro = ocupadoPor && ocupadoPor !== modal.id
                const seleccionado = modal.rolesIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={'rol-opt' + (ocupadoOtro ? ' disabled' : '') + (seleccionado ? ' on' : '')}
                    title={ocupadoOtro ? 'Asignado a otro contrato vigente' : ''}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      disabled={ocupadoOtro}
                      onChange={() => toggleRol(p.id)}
                    />
                    <span>
                      <strong>{p.rol}</strong> {p.direccion}
                      {ocupadoOtro && <em> · en otro contrato</em>}
                    </span>
                  </label>
                )
              })}
            </div>
          </Field>

          <div className="grid2">
            <Field label="Inicio *">
              <input type="date" value={modal.inicio} onChange={set('inicio')} />
            </Field>
            <Field label="Término" hint="Vacío = indefinido">
              <input type="date" value={modal.termino} onChange={set('termino')} />
            </Field>
            <Field label="Moneda del arriendo">
              <select value={modal.moneda} onChange={set('moneda')}>
                <option value="CLP">Pesos (CLP)</option>
                <option value="UF">UF</option>
              </select>
            </Field>
            <Field label={modal.moneda === 'UF' ? 'Monto mensual (UF)' : 'Monto mensual (CLP)'}>
              <input type="number" step="any" value={modal.monto} onChange={set('monto')} />
            </Field>
            <Field label="Día de pago">
              <input type="number" min="1" max="31" value={modal.diaPago} onChange={set('diaPago')} />
            </Field>
            <Field label="Reajuste">
              <input value={modal.reajuste} onChange={set('reajuste')} placeholder="Anual IPC" />
            </Field>
            <Field label="Garantía (CLP)">
              <input type="number" value={modal.garantia} onChange={set('garantia')} />
            </Field>
          </div>

          <div className="grid2">
            <Field label="Contrato (PDF)" full>
              <div className="file-row">
                {modal.contratoPdfId ? (
                  <>
                    <button type="button" className="link" onClick={() => abrirPDF(modal.contratoPdfId)}>
                      <Icon.Eye width={15} height={15} /> {modal.contratoPdfNombre || 'Ver PDF'}
                    </button>
                    <button
                      type="button"
                      className="link danger"
                      onClick={async () => {
                        await eliminarPDF(modal.contratoPdfId)
                        setModal((m) => ({ ...m, contratoPdfId: null, contratoPdfNombre: '' }))
                      }}
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <label className="btn btn-ghost btn-sm">
                    <Icon.Upload width={15} height={15} /> Subir contrato
                    <input type="file" accept="application/pdf" hidden onChange={subirContrato} />
                  </label>
                )}
              </div>
            </Field>
          </div>

          <Field label="Anexos (PDF)" full>
            <div className="anexos">
              {(modal.anexos || []).map((a) => (
                <div className="anexo" key={a.id}>
                  <button type="button" className="link" onClick={() => abrirPDF(a.id)}>
                    <Icon.Eye width={15} height={15} /> {a.nombre}
                  </button>
                  <button type="button" className="link danger" onClick={() => quitarAnexo(a.id)}>
                    Quitar
                  </button>
                </div>
              ))}
              <label className="btn btn-ghost btn-sm">
                <Icon.Upload width={15} height={15} /> Agregar anexo
                <input type="file" accept="application/pdf" hidden onChange={subirAnexo} />
              </label>
            </div>
          </Field>

          <Field label="Notas" full>
            <textarea rows={2} value={modal.notas} onChange={set('notas')} />
          </Field>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto={`¿Eliminar el contrato de "${nombreArr(borrar.arrendatarioId)}"? Los ingresos asociados quedarán sin contrato.`}
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            if (borrar.contratoPdfId) await eliminarPDF(borrar.contratoPdfId)
            for (const a of borrar.anexos || []) await eliminarPDF(a.id)
            await eliminar(STORES.contratos, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
