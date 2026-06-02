import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Icon } from './Icons'
import { fmtCLP, fmtFecha, diasEntre, hoyISO, periodoActual, fmtPeriodo } from '../utils/helpers'

export default function Panel({ ir }) {
  const { propiedades, arrendatarios, contratos, polizas, ingresos, avisoDias, cambiarAvisoDias } = useData()

  const nombreArr = (cId) => {
    const c = contratos.find((x) => x.id === cId)
    return c ? arrendatarios.find((a) => a.id === c.arrendatarioId)?.nombre || '—' : '—'
  }

  const vencimientos = useMemo(() => {
    const hoy = hoyISO()
    const items = []
    for (const c of contratos) {
      if (c.estado === 'terminado' || !c.termino) continue
      const d = diasEntre(hoy, c.termino)
      if (d <= avisoDias) items.push({ tipo: 'Contrato', nombre: nombreArr(c.id), fecha: c.termino, dias: d, id: c.id, destino: 'contratos' })
    }
    for (const p of polizas) {
      if (!p.termino) continue
      const d = diasEntre(hoy, p.termino)
      if (d <= avisoDias) items.push({ tipo: 'Póliza', nombre: p.compania, fecha: p.termino, dias: d, id: p.id, destino: 'polizas' })
    }
    return items.sort((a, b) => a.dias - b.dias)
  }, [contratos, polizas, avisoDias, arrendatarios])

  const morosos = useMemo(() => {
    const per = periodoActual()
    const vigentes = contratos.filter((c) => c.estado !== 'terminado')
    let n = 0
    for (const c of vigentes) {
      const ing = ingresos.find((i) => i.contratoId === c.id && i.periodo === per)
      if (!ing || ing.estado !== 'pagado') n++
    }
    return n
  }, [contratos, ingresos])

  const ingresosMes = useMemo(() => {
    const per = periodoActual()
    return ingresos
      .filter((i) => i.periodo === per && i.estado === 'pagado')
      .reduce((s, i) => s + (Number(i.totalCLP) || 0), 0)
  }, [ingresos])

  const tarjetas = [
    { label: 'Propiedades', valor: propiedades.length, icon: <Icon.Building />, destino: 'propiedades' },
    { label: 'Arrendatarios', valor: arrendatarios.length, icon: <Icon.Users />, destino: 'arrendatarios' },
    { label: 'Contratos vigentes', valor: contratos.filter((c) => c.estado !== 'terminado').length, icon: <Icon.Doc />, destino: 'contratos' },
    { label: 'Pólizas', valor: polizas.length, icon: <Icon.Shield />, destino: 'polizas' },
  ]

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Panel</h1>
          <p className="page-desc">Resumen general y avisos de vencimientos próximos.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {tarjetas.map((t) => (
          <button key={t.label} className="kpi" onClick={() => ir(t.destino)}>
            <span className="kpi-icon">{t.icon}</span>
            <span className="kpi-val">{t.valor}</span>
            <span className="kpi-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="kpi-grid kpi-grid-2">
        <div className="kpi kpi-soft ok">
          <span className="kpi-label">Recaudado {fmtPeriodo(periodoActual())}</span>
          <span className="kpi-val">{fmtCLP(ingresosMes)}</span>
        </div>
        <button className="kpi kpi-soft warn" onClick={() => ir('reportes')}>
          <span className="kpi-label">Contratos morosos este mes</span>
          <span className="kpi-val">{morosos}</span>
        </button>
      </div>

      <div className="panel-section">
        <div className="section-head">
          <h2><Icon.Bell width={18} height={18} /> Vencimientos próximos</h2>
          <div className="aviso-sel">
            <span>Avisar con</span>
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                className={'chip' + (avisoDias === d ? ' on' : '')}
                onClick={() => cambiarAvisoDias(d)}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {vencimientos.length === 0 ? (
          <div className="empty small">
            <Icon.Check width={28} height={28} />
            <p>Sin vencimientos en los próximos {avisoDias} días.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Vence</th>
                  <th>Plazo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vencimientos.map((v, idx) => (
                  <tr key={idx}>
                    <td>{v.tipo}</td>
                    <td className="strong">{v.nombre}</td>
                    <td>{fmtFecha(v.fecha)}</td>
                    <td>
                      {v.dias < 0 ? (
                        <span className="badge badge-danger">Vencido hace {Math.abs(v.dias)}d</span>
                      ) : v.dias <= 15 ? (
                        <span className="badge badge-danger">En {v.dias}d</span>
                      ) : (
                        <span className="badge badge-warn">En {v.dias}d</span>
                      )}
                    </td>
                    <td className="actions">
                      <button className="link" onClick={() => ir(v.destino)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
