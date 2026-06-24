import { useEffect } from 'react'
import { Icon } from './Icons'

export function Modal({ titulo, children, onClose, onGuardar, textoGuardar = 'Guardar', ancho = 560 }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: ancho }}>
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon.Close />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {onGuardar && (
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={onGuardar}>
              {textoGuardar}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon, titulo, texto, accion }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {accion}
    </div>
  )
}

export function ConfirmDelete({ texto, onClose, onConfirm }) {
  return (
    <Modal titulo="Confirmar eliminación" onClose={onClose} ancho={420}>
      <p className="confirm-text">{texto}</p>
      <p className="confirm-warn">Esta acción no se puede deshacer.</p>
      <div className="modal-foot" style={{ marginTop: 18, paddingTop: 0, border: 'none' }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          Eliminar
        </button>
      </div>
    </Modal>
  )
}

// Campo de formulario
export function Field({ label, children, hint, full }) {
  return (
    <label className={'field' + (full ? ' full' : '')}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Badge({ tipo = 'default', children }) {
  return <span className={'badge badge-' + tipo}>{children}</span>
}
