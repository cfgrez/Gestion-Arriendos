// Iconos SVG inline (sin dependencias). Trazos de 1.6px, estilo lineal.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) => (props) =>
  (
    <svg {...base} {...props}>
      {paths}
    </svg>
  )

export const Icon = {
  Home: make(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),
  Building: make(
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
    </>,
  ),
  Users: make(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M16 5a3 3 0 0 1 0 6M21 20c0-2-1-3.5-3-4.3" />
    </>,
  ),
  Doc: make(
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>,
  ),
  Shield: make(<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />),
  Cash: make(
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v6M18 9v6" />
    </>,
  ),
  Receipt: make(
    <>
      <path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M9 8h6M9 12h6" />
    </>,
  ),
  Bell: make(
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  ),
  Chart: make(<><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>),
  Database: make(
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>,
  ),
  Plus: make(<><path d="M12 5v14M5 12h14" /></>),
  Search: make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>),
  Edit: make(
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>,
  ),
  Trash: make(
    <>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </>,
  ),
  Close: make(<><path d="M6 6l12 12M18 6L6 18" /></>),
  Upload: make(
    <>
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </>,
  ),
  Download: make(
    <>
      <path d="M12 4v12M8 12l4 4 4-4" />
      <path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
    </>,
  ),
  Eye: make(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  Check: make(<path d="M5 13l4 4L19 7" />),
  Alert: make(<><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>),
  Refresh: make(
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </>,
  ),
  Menu: make(<><path d="M4 6h16M4 12h16M4 18h16" /></>),
  Filter: make(<path d="M3 5h18l-7 8v6l-4-2v-4z" />),
}
