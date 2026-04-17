import CSVUploader from './CSVUploader'

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  if (diff < 7 * 86_400_000) return Math.floor(diff / 86_400_000) + 'd ago'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HomePage({ orgs, onOpen, onNew, onDelete, onDuplicate, onFile, onSample }) {
  return (
    <div className="home">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="4" r="3" fill="white" />
              <circle cx="4" cy="18" r="3" fill="white" />
              <circle cx="20" cy="18" r="3" fill="white" />
              <line x1="12" y1="7" x2="12" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="14" x2="4" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="14" x2="20" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="app-name">Organogram</span>
        </div>
        <div className="header-right">
          <CSVUploader onFile={onFile} label="Import CSV" className="copy-btn" />
          <button className="upload-btn" onClick={onNew}>+ New</button>
        </div>
      </header>

      <div className="home-body">
        {orgs.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2">
                <circle cx="12" cy="4" r="2.5" />
                <circle cx="4" cy="19" r="2.5" />
                <circle cx="20" cy="19" r="2.5" />
                <line x1="12" y1="6.5" x2="12" y2="13" strokeLinecap="round" />
                <line x1="12" y1="13" x2="4" y2="16.5" strokeLinecap="round" />
                <line x1="12" y1="13" x2="20" y2="16.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="home-empty-title">No organograms yet</p>
            <p className="home-empty-sub">Create your first org chart or import an existing CSV file.</p>
            <div className="home-empty-actions">
              <button className="upload-btn" onClick={onNew}>+ New organogram</button>
              <button className="copy-btn" onClick={onSample}>Try sample data</button>
            </div>
          </div>
        ) : (
          <div className="home-content">
            <div className="home-section-header">
              <span className="home-section-title">Your organograms</span>
              <span className="home-section-count">{orgs.length}</span>
            </div>
            <div className="org-grid">
              {orgs.map(org => (
                <OrgCard key={org.id} org={org} onOpen={onOpen} onDelete={onDelete} onDuplicate={onDuplicate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OrgCard({ org, onOpen, onDelete, onDuplicate }) {
  return (
    <div className="org-card" onClick={() => onOpen(org)}>
      <div className="org-card__preview">
        <svg width="100%" height="100%" viewBox="0 0 140 88" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="50" y="8" width="40" height="18" rx="4" fill="#e0e7ff" />
          <line x1="70" y1="26" x2="70" y2="36" stroke="#c7d2fe" strokeWidth="1.5" />
          <line x1="22" y1="36" x2="118" y2="36" stroke="#c7d2fe" strokeWidth="1.5" />
          <line x1="22" y1="36" x2="22" y2="44" stroke="#c7d2fe" strokeWidth="1.5" />
          <line x1="70" y1="36" x2="70" y2="44" stroke="#c7d2fe" strokeWidth="1.5" />
          <line x1="118" y1="36" x2="118" y2="44" stroke="#c7d2fe" strokeWidth="1.5" />
          <rect x="6" y="44" width="32" height="16" rx="3" fill="#ede9fe" />
          <rect x="54" y="44" width="32" height="16" rx="3" fill="#dbeafe" />
          <rect x="102" y="44" width="32" height="16" rx="3" fill="#dcfce7" />
          <line x1="22" y1="60" x2="22" y2="68" stroke="#c7d2fe" strokeWidth="1.2" />
          <rect x="8" y="68" width="28" height="12" rx="2" fill="#fce7f3" opacity="0.7" />
          <line x1="70" y1="60" x2="70" y2="68" stroke="#c7d2fe" strokeWidth="1.2" />
          <rect x="56" y="68" width="28" height="12" rx="2" fill="#fef3c7" opacity="0.7" />
        </svg>
      </div>
      <div className="org-card__body">
        <div className="org-card__title">{org.title}</div>
        <div className="org-card__meta">
          <span>{org.rowCount ?? '—'} people</span>
          <span className="meta-sep">·</span>
          <span>Updated {timeAgo(org.updatedAt)}</span>
        </div>
        <div className="org-card__actions" onClick={e => e.stopPropagation()}>
          <button className="card-open-btn" onClick={() => onOpen(org)}>Open →</button>
          <button className="card-action-btn" onClick={() => onDuplicate(org)} title="Duplicate">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          <button className="card-action-btn card-action-btn--danger" onClick={() => onDelete(org.id)} title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
