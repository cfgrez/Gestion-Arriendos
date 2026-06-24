import { useState } from 'react'
import { useData } from './context/DataContext'
import { Icon } from './components/Icons'
import Panel from './components/Panel'
import Propiedades from './components/Propiedades'
import Arrendatarios from './components/Arrendatarios'
import Contratos from './components/Contratos'
import Polizas from './components/Polizas'
import Compraventas from './components/Compraventas'
import Ingresos from './components/Ingresos'
import Gastos from './components/Gastos'
import Reportes from './components/Reportes'
import Datos from './components/Datos'

const NAV = [
  { id: 'panel', label: 'Panel', icon: Icon.Home },
  { id: 'propiedades', label: 'Propiedades', icon: Icon.Building },
  { id: 'arrendatarios', label: 'Arrendatarios', icon: Icon.Users },
  { id: 'contratos', label: 'Contratos', icon: Icon.Doc },
  { id: 'polizas', label: 'Pólizas', icon: Icon.Shield },
  { id: 'compraventas', label: 'Compraventas', icon: Icon.Key },
  { id: 'ingresos', label: 'Ingresos', icon: Icon.Cash },
  { id: 'gastos', label: 'Gastos', icon: Icon.Receipt },
  { id: 'reportes', label: 'Reportes', icon: Icon.Chart },
  { id: 'datos', label: 'Datos y respaldo', icon: Icon.Database },
]

export default function App() {
  const { cargando } = useData()
  const [vista, setVista] = useState('panel')
  const [menuAbierto, setMenuAbierto] = useState(false)

  const ir = (v) => {
    setVista(v)
    setMenuAbierto(false)
  }

  if (cargando) {
    return (
      <div className="loader">
        <div className="loader-mark"><Icon.Home width={26} height={26} /></div>
        <p>Cargando…</p>
      </div>
    )
  }

  const Vista = {
    panel: <Panel ir={ir} />,
    propiedades: <Propiedades />,
    arrendatarios: <Arrendatarios />,
    contratos: <Contratos />,
    polizas: <Polizas />,
    compraventas: <Compraventas />,
    ingresos: <Ingresos />,
    gastos: <Gastos />,
    reportes: <Reportes />,
    datos: <Datos />,
  }[vista]

  return (
    <div className="app">
      <aside className={'sidebar' + (menuAbierto ? ' open' : '')}>
        <div className="brand">
          <span className="brand-mark"><Icon.Home width={20} height={20} /></span>
          <span className="brand-text">
            <strong>Gestión de</strong>
            <span>Arriendos</span>
          </span>
        </div>
        <nav>
          {NAV.map((n) => {
            const I = n.icon
            return (
              <button
                key={n.id}
                className={'nav-item' + (vista === n.id ? ' on' : '')}
                onClick={() => ir(n.id)}
              >
                <I width={18} height={18} />
                <span>{n.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-foot">
          <span>Datos locales en este navegador</span>
        </div>
      </aside>

      {menuAbierto && <div className="backdrop" onClick={() => setMenuAbierto(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenuAbierto((v) => !v)} aria-label="Menú">
            <Icon.Menu />
          </button>
          <span className="topbar-title">{NAV.find((n) => n.id === vista)?.label}</span>
        </header>
        <main className="content">{Vista}</main>
      </div>
    </div>
  )
}
