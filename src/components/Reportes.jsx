import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { fmtCLP, descargarCSV, periodoActual, periodosRecientes, fmtPeriodo } from '../utils/helpers'

export default function Reportes() {
  const { propiedades, arrendatarios, contratos, ingresos, gastos } = useData()
  const [tab, setTab] = useState('morosidad')
  const [periodo, setPeriodo] = useState(periodoActual())

  const nombreArr = (id) => arrendatarios.find((a) => a.id === id)?.nombre || '—'
  const rolesContrato = (c) =>
    (c.rolesIds || []).map((r) => propiedades.find((p) => p.id === r)?.rol).filter(Boolean).join(', ')

  // ----- Morosidad: contratos vigentes sin pago "pagado" en el período -----
  const morosidad = useMemo(() => {
    const vigentes = contratos.filter((c) => c.estado !== 'terminado')
    return vigentes.map((c) => {
      const ing = ingresos.find((i) => i.contratoId === c.id && i.periodo === periodo)
      let estado = 'Sin registro'
      if (ing) estado = ing.estado === 'pagado' ? 'Pagado' : 'Pendiente'
      const esperado = c.moneda === 'UF' ? null : c.monto
      return {
        arrendatario: nombreArr(c.arrendatarioId),
        roles: rolesContrato(c),
        moneda: c.moneda,
        montoPactado: c.monto,
        estado,
        pagado: ing && ing.estado === 'pagado' ? Number(ing.totalCLP) || 0 : 0,
      }
    })
  }, [contratos, ingresos, periodo, propiedades, arrendatarios])

  const morososResumen = useMemo(() => {
    let alDia = 0, pendientes = 0, sinReg = 0
    for (const m of morosidad) {
      if (m.estado === 'Pagado') alDia++
      else if (m.estado === 'Pendiente') pendientes++
      else sinReg++
    }
    return { alDia, pendientes, sinReg, totalRecaudado: morosidad.reduce((s, m) => s + m.pagado, 0) }
  }, [morosidad])

  // ----- Rentabilidad por rol (acumulado total) -----
  const rentabilidad = useMemo(() => {
    return propiedades
      .map((p) => {
        // Ingresos: prorratea el total del contrato entre sus roles
        let ing = 0
        for (const i of ingresos) {
          if (i.estado !== 'pagado') continue
          const c = contratos.find((x) => x.id === i.contratoId)
          if (!c || !(c.rolesIds || []).includes(p.id)) continue
          const nRoles = (c.rolesIds || []).length || 1
          ing += (Number(i.totalCLP) || 0) / nRoles
        }
        const gas = gastos.filter((g) => g.rolId === p.id).reduce((s, g) => s + (Number(g.monto) || 0), 0)
        return {
          rol: p.rol,
          direccion: p.direccion || '',
          grupo: p.grupo || '',
          ingresos: Math.round(ing),
          gastos: gas,
          neto: Math.round(ing) - gas,
        }
      })
      .sort((a, b) => b.neto - a.neto)
  }, [propiedades, ingresos, gastos, contratos])

  const rentTotales = useMemo(() => {
    return rentabilidad.reduce(
      (acc, r) => ({ ingresos: acc.ingresos + r.ingresos, gastos: acc.gastos + r.gastos, neto: acc.neto + r.neto }),
      { ingresos: 0, gastos: 0, neto: 0 },
    )
  }, [rentabilidad])

  const exportarMorosidad = () =>
    descargarCSV(
      `morosidad-${periodo}.csv`,
      morosidad.map((m) => ({
        Periodo: periodo,
        Arrendatario: m.arrendatario,
        Roles: m.roles,
        MontoPactado: m.montoPactado,
        Moneda: m.moneda,
        Estado: m.estado,
        RecaudadoCLP: m.pagado,
      })),
    )

  const exportarRentabilidad = () =>
    descargarCSV(
      'rentabilidad.csv',
      rentabilidad.map((r) => ({
        Rol: r.rol,
        Direccion: r.direccion,
        Grupo: r.grupo,
        IngresosCLP: r.ingresos,
        GastosCLP: r.gastos,
        NetoCLP: r.neto,
      })),
    )

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-desc">Morosidad por período y rentabilidad por propiedad.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={'tab' + (tab === 'morosidad' ? ' on' : '')} onClick={() => setTab('morosidad')}>
          Morosidad
        </button>
        <button className={'tab' + (tab === 'rentabilidad' ? ' on' : '')} onClick={() => setTab('rentabilidad')}>
          Rentabilidad
        </button>
      </div>

      {tab === 'morosidad' && (
        <div>
          <div className="toolbar">
            <div className="filtros inline">
              <label className="lbl-inline">Período</label>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                {periodosRecientes(24).map((p) => (
                  <option key={p} value={p}>{fmtPeriodo(p)}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost" onClick={exportarMorosidad}>
              <Icon.Download width={16} height={16} /> CSV
            </button>
          </div>

          <div className="stat-row">
            <div className="stat ok"><span className="stat-label">Al día</span><span className="stat-val">{morososResumen.alDia}</span></div>
            <div className="stat warn"><span className="stat-label">Pendientes</span><span className="stat-val">{morososResumen.pendientes}</span></div>
            <div className="stat muted"><span className="stat-label">Sin registro</span><span className="stat-val">{morososResumen.sinReg}</span></div>
            <div className="stat"><span className="stat-label">Recaudado</span><span className="stat-val">{fmtCLP(morososResumen.totalRecaudado)}</span></div>
          </div>

          {morosidad.length === 0 ? (
            <div className="empty small"><Icon.Chart width={28} height={28} /><p>No hay contratos vigentes.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Arrendatario</th><th>Roles</th><th>Pactado</th><th>Estado</th><th className="num">Recaudado</th></tr>
                </thead>
                <tbody>
                  {morosidad.map((m, i) => (
                    <tr key={i}>
                      <td className="strong">{m.arrendatario}</td>
                      <td className="muted">{m.roles}</td>
                      <td>{m.moneda === 'UF' ? `${m.montoPactado} UF` : fmtCLP(m.montoPactado)}</td>
                      <td>
                        {m.estado === 'Pagado' ? <span className="badge badge-ok">Pagado</span>
                          : m.estado === 'Pendiente' ? <span className="badge badge-warn">Pendiente</span>
                          : <span className="badge badge-danger">Sin registro</span>}
                      </td>
                      <td className="num">{fmtCLP(m.pagado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'rentabilidad' && (
        <div>
          <div className="toolbar">
            <p className="muted small">Ingresos pagados (acumulado) menos gastos, por propiedad. El total de un contrato con varios roles se reparte en partes iguales.</p>
            <button className="btn btn-ghost" onClick={exportarRentabilidad}>
              <Icon.Download width={16} height={16} /> CSV
            </button>
          </div>

          <div className="stat-row">
            <div className="stat ok"><span className="stat-label">Ingresos</span><span className="stat-val">{fmtCLP(rentTotales.ingresos)}</span></div>
            <div className="stat warn"><span className="stat-label">Gastos</span><span className="stat-val">{fmtCLP(rentTotales.gastos)}</span></div>
            <div className={'stat ' + (rentTotales.neto >= 0 ? 'ok' : 'danger')}><span className="stat-label">Neto</span><span className="stat-val">{fmtCLP(rentTotales.neto)}</span></div>
          </div>

          {rentabilidad.length === 0 ? (
            <div className="empty small"><Icon.Chart width={28} height={28} /><p>No hay propiedades.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Rol</th><th>Dirección</th><th>Grupo</th><th className="num">Ingresos</th><th className="num">Gastos</th><th className="num">Neto</th></tr>
                </thead>
                <tbody>
                  {rentabilidad.map((r, i) => (
                    <tr key={i}>
                      <td className="strong">{r.rol}</td>
                      <td>{r.direccion}</td>
                      <td>{r.grupo || '—'}</td>
                      <td className="num">{fmtCLP(r.ingresos)}</td>
                      <td className="num">{fmtCLP(r.gastos)}</td>
                      <td className={'num strong ' + (r.neto >= 0 ? 'pos' : 'neg')}>{fmtCLP(r.neto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
