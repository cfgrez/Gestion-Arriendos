import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { Modal, EmptyState, ConfirmDelete, Field, Badge } from './UI'
import {
  nuevoId, fmtCLP, fmtUF, fmtNum, fmtFecha, fmtPeriodo,
  hoyISO, periodoActual, periodosRecientes, descargarCSV,
} from '../utils/helpers'

const vacioBase = {
  contratoId: '', periodo: '', fechaPago: '', estado: 'pagado',
  moneda: 'CLP', monto: '', valorUF: '', totalCLP: '', notas: '',
}

export default function Ingresos() {
  const {
    ingresos, contratos, arrendatarios, propiedades, guardar, eliminar, STORES, obtenerUF,
  } = useData()
  const [modal, setModal] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const [cargandoUF, setCargandoUF] = useState(false)
  const [fArr, setFArr] = useState('todos')
  const [fGrupo, setFGrupo] = useState('todos')
  const [fEstado, setFEstado] = useState('todos')
  const [fPeriodo, setFPeriodo] = useState('todos')

  const nombreArr = (cId) => {
    const c = contratos.find((x) => x.id === cId)
    return c ? arrendatarios.find((a) => a.id === c.arrendatarioId)?.nombre || '—' : '—'
  }
  const rolesDeContrato = (cId) => {
    const c = contratos.find((x) => x.id === cId)
    if (!c) return ''
    return (c.rolesIds || [])
      .map((r) => propiedades.find((p) => p.id === r)?.rol)
      .filter(Boolean)
      .join(', ')
  }
  const grupoContrato = (cId) => {
    const c = contratos.find((x) => x.id === cId)
    if (!c) return ''
    const p = propiedades.find((pp) => (c.rolesIds || []).includes(pp.id))
    return p?.grupo || ''
  }

  const grupos = useMemo(
    () => [...new Set(propiedades.map((p) => p.grupo).filter(Boolean))].sort(),
    [propiedades],
  )
  const periodos = useMemo(() => {
    const s = new Set(ingresos.map((i) => i.periodo).filter(Boolean))
    return [...s].sort().reverse()
  }, [ingresos])

  const lista = useMemo(() => {
    return ingresos
      .filter((i) => {
        if (fEstado !== 'todos' && i.estado !== fEstado) return false
        if (fPeriodo !== 'todos' && i.periodo !== fPeriodo) return false
        const c = contratos.find((x) => x.id === i.contratoId)
        if (fArr !== 'todos' && c?.arrendatarioId !== fArr) return false
        if (fGrupo !== 'todos' && grupoContrato(i.contratoId) !== fGrupo) return false
        return true
      })
      .sort((a, b) => (b.periodo || '').localeCompare(a.periodo || '') || (b.fechaPago || '').localeCompare(a.fechaPago || ''))
  }, [ingresos, fArr, fGrupo, fEstado, fPeriodo, contratos])

  const totales = useMemo(() => {
    let pagado = 0, pendiente = 0
    for (const i of lista) {
      const v = Number(i.totalCLP) || 0
      if (i.estado === 'pagado') pagado += v
      else pendiente += v
    }
    return { pagado, pendiente }
  }, [lista])

  const abrirNuevo = () => {
    if (!contratos.length) return alert('Primero crea al menos un contrato.')
    setModal({ ...vacioBase, periodo: periodoActual(), fechaPago: hoyISO() })
  }

  // Al elegir contrato, precargar moneda y monto
  const elegirContrato = (cId) => {
    const c = contratos.find((x) => x.id === cId)
    setModal((m) => ({
      ...m,
      contratoId: cId,
      moneda: c?.moneda || 'CLP',
      monto: c?.monto ?? '',
      valorUF: '',
      totalCLP: c?.moneda === 'UF' ? '' : String(c?.monto ?? ''),
    }))
  }

  const recalcular = (m) => {
    if (m.moneda === 'UF') {
      const t = (Number(m.monto) || 0) * (Number(m.valorUF) || 0)
      return { ...m, totalCLP: t ? String(Math.round(t)) : '' }
    }
    return { ...m, totalCLP: String(Number(m.monto) || 0) }
  }

  const set = (k) => (e) => setModal((m) => recalcular({ ...m, [k]: e.target.value }))

  const traerUF = async () => {
    if (!modal.fechaPago) return alert('Indica la fecha de pago para valorizar la UF.')
    setCargandoUF(true)
    try {
      const valor = await obtenerUF(modal.fechaPago)
      setModal((m) => recalcular({ ...m, valorUF: String(valor) }))
    } catch (e) {
      alert('No se pudo obtener la UF automáticamente. Puedes ingresarla a mano.\n\n' + e.message)
    } finally {
      setCargandoUF(false)
    }
  }

  const guardarItem = async () => {
    if (!modal.contratoId) return alert('Selecciona un contrato.')
    if (!modal.periodo) return alert('Indica el período.')
    if (modal.moneda === 'UF' && !modal.valorUF) return alert('Falta el valor de la UF.')
    const m = recalcular(modal)
    await guardar(STORES.ingresos, {
      ...m,
      monto: Number(m.monto) || 0,
      valorUF: m.moneda === 'UF' ? Number(m.valorUF) || 0 : null,
      totalCLP: Number(m.totalCLP) || 0,
      id: m.id || nuevoId(),
    })
    setModal(null)
  }

  const exportar = () => {
    descargarCSV(
      'ingresos.csv',
      lista.map((i) => ({
        Periodo: i.periodo,
        Arrendatario: nombreArr(i.contratoId),
        Roles: rolesDeContrato(i.contratoId),
        Estado: i.estado,
        Moneda: i.moneda,
        Monto: i.monto,
        ValorUF: i.valorUF || '',
        TotalCLP: i.totalCLP,
        FechaPago: i.fechaPago || '',
      })),
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ingresos por arriendo</h1>
          <p className="page-desc">Pagos por período. Los contratos en UF se valorizan al valor del día de pago.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportar}>
            <Icon.Download width={16} height={16} /> CSV
          </button>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            <Icon.Plus /> Registrar pago
          </button>
        </div>
      </div>

      <div className="filtros">
        <select value={fArr} onChange={(e) => setFArr(e.target.value)}>
          <option value="todos">Todos los arrendatarios</option>
          {arrendatarios.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select value={fGrupo} onChange={(e) => setFGrupo(e.target.value)}>
          <option value="todos">Todos los grupos</option>
          {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pagado">Pagados</option>
          <option value="pendiente">Pendientes</option>
        </select>
        <select value={fPeriodo} onChange={(e) => setFPeriodo(e.target.value)}>
          <option value="todos">Todos los períodos</option>
          {periodos.map((p) => <option key={p} value={p}>{fmtPeriodo(p)}</option>)}
        </select>
      </div>

      <div className="stat-row">
        <div className="stat ok">
          <span className="stat-label">Pagado (filtro)</span>
          <span className="stat-val">{fmtCLP(totales.pagado)}</span>
        </div>
        <div className="stat warn">
          <span className="stat-label">Pendiente (filtro)</span>
          <span className="stat-val">{fmtCLP(totales.pendiente)}</span>
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={<Icon.Cash width={34} height={34} />} titulo="Sin ingresos" texto="Registra los pagos de arriendo recibidos." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Arrendatario</th>
                <th>Roles</th>
                <th>Pactado</th>
                <th className="num">Total CLP</th>
                <th>Estado</th>
                <th>Pago</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i) => (
                <tr key={i.id}>
                  <td className="strong">{fmtPeriodo(i.periodo)}</td>
                  <td>{nombreArr(i.contratoId)}</td>
                  <td className="muted">{rolesDeContrato(i.contratoId)}</td>
                  <td>
                    {i.moneda === 'UF'
                      ? `${fmtUF(i.monto)} (UF ${fmtNum(i.valorUF, 0)})`
                      : fmtCLP(i.monto)}
                  </td>
                  <td className="num strong">{fmtCLP(i.totalCLP)}</td>
                  <td>
                    {i.estado === 'pagado'
                      ? <Badge tipo="ok">Pagado</Badge>
                      : <Badge tipo="warn">Pendiente</Badge>}
                  </td>
                  <td>{i.estado === 'pagado' ? fmtFecha(i.fechaPago) : '—'}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setModal({ ...i })} title="Editar">
                      <Icon.Edit />
                    </button>
                    <button className="icon-btn danger" onClick={() => setBorrar(i)} title="Eliminar">
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
        <Modal titulo={modal.id ? 'Editar pago' : 'Registrar pago'} onClose={() => setModal(null)} onGuardar={guardarItem} ancho={600}>
          <div className="grid2">
            <Field label="Contrato *" full>
              <select value={modal.contratoId} onChange={(e) => elegirContrato(e.target.value)}>
                <option value="">— Selecciona —</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {arrendatarios.find((a) => a.id === c.arrendatarioId)?.nombre} ·{' '}
                    {(c.rolesIds || []).map((r) => propiedades.find((p) => p.id === r)?.rol).filter(Boolean).join(', ')}
                    {c.estado === 'terminado' ? ' (terminado)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Período *">
              <select value={modal.periodo} onChange={set('periodo')}>
                {periodosRecientes(24).map((p) => (
                  <option key={p} value={p}>{fmtPeriodo(p)}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={modal.estado} onChange={set('estado')}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </Field>
            <Field label="Fecha de pago">
              <input type="date" value={modal.fechaPago} onChange={set('fechaPago')} />
            </Field>
            <Field label="Moneda">
              <select value={modal.moneda} onChange={set('moneda')}>
                <option value="CLP">Pesos (CLP)</option>
                <option value="UF">UF</option>
              </select>
            </Field>
            <Field label={modal.moneda === 'UF' ? 'Monto (UF)' : 'Monto (CLP)'}>
              <input type="number" step="any" value={modal.monto} onChange={set('monto')} />
            </Field>

            {modal.moneda === 'UF' && (
              <Field label="Valor UF del día" hint="Se obtiene de mindicador.cl o ingrésalo a mano">
                <div className="uf-row">
                  <input type="number" step="any" value={modal.valorUF} onChange={set('valorUF')} placeholder="Ej: 38000" />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={traerUF} disabled={cargandoUF}>
                    <Icon.Refresh width={15} height={15} /> {cargandoUF ? 'Buscando…' : 'Traer UF'}
                  </button>
                </div>
              </Field>
            )}

            <Field label="Total en pesos (CLP)" hint={modal.moneda === 'UF' ? 'Calculado: monto × valor UF' : 'Igual al monto'}>
              <input type="number" value={modal.totalCLP} readOnly />
            </Field>
            <Field label="Notas" full>
              <textarea rows={2} value={modal.notas} onChange={set('notas')} />
            </Field>
          </div>
        </Modal>
      )}

      {borrar && (
        <ConfirmDelete
          texto={`¿Eliminar el ingreso de ${fmtPeriodo(borrar.periodo)} (${fmtCLP(borrar.totalCLP)})?`}
          onClose={() => setBorrar(null)}
          onConfirm={async () => {
            await eliminar(STORES.ingresos, borrar.id)
            setBorrar(null)
          }}
        />
      )}
    </div>
  )
}
