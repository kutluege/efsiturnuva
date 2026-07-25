// Shared confirmation dialog (league delete / remove-from-list etc.)
function ConfirmModal({ t, title, body, confirmLabel, danger, busy, onConfirm, onCancel }) {
  return (
    <div className="sheet-overlay center">
      <div className="champion-card confirm-card">
        <div className="kicker">{title}</div>
        <div className="note" style={{ marginTop: 10 }}>{body}</div>
        <div className="sheet-actions-2" style={{ padding: '16px 0 0' }}>
          <button className="btn-cancel" onClick={onCancel} disabled={busy}>{t.cancel}</button>
          <button
            className={`btn-save ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? t.deleting : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
