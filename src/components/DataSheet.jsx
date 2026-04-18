import { useRef } from 'react'
import { getDeptColor } from './OrgNode'

export default function DataSheet({ rows, onChange, onClose }) {
  const nameById = Object.fromEntries(rows.map(r => [r.id, r.name]))

  const update = (id, field, value) =>
    onChange(rows.map(r => r.id === id ? { ...r, [field]: value } : r))

  const addRow = () => {
    const newId = String(Math.max(0, ...rows.map(r => parseInt(r.id) || 0)) + 1)
    onChange([...rows, { id: newId, name: 'New Person', title: '', department: '', manager_id: '', is_open: 'false', cols: '' }])
  }

  const deleteRow = id => onChange(rows.filter(r => r.id !== id))

  const depts = [...new Set(rows.map(r => r.department).filter(Boolean))]
  const deptListId = 'dept-options'

  return (
    <div className="sheet">
      <div className="sheet-header">
        <div className="sheet-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          Edit Data
        </div>
        <button className="sheet-close" onClick={onClose}>✕</button>
      </div>

      <div className="sheet-body">
        <table className="sheet-table">
          <thead>
            <tr>
              <th style={{ width: 160 }}>Name</th>
              <th style={{ width: 190 }}>Title</th>
              <th style={{ width: 120 }}>Department</th>
              <th style={{ width: 150 }}>Reports To</th>
              <th style={{ width: 52 }}>Open</th>
              <th style={{ width: 52 }} title="Max children per row">Cols</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            <datalist id={deptListId}>
              {depts.map(d => <option key={d} value={d} />)}
            </datalist>
            {rows.map((row, i) => {
              const color = getDeptColor(row.department)
              const isOpen = row.is_open === 'true'
              return (
                <tr key={row.id} className={isOpen ? 'row-open' : ''}>
                  <td>
                    <div className="cell-with-dot">
                      <div className="dept-dot" style={{ background: color }} />
                      <input
                        className="cell-input"
                        value={row.name}
                        onChange={e => update(row.id, 'name', e.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      value={row.title}
                      onChange={e => update(row.id, 'title', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      list={deptListId}
                      value={row.department}
                      placeholder="Department"
                      onChange={e => update(row.id, 'department', e.target.value)}
                      style={{ color: getDeptColor(row.department) }}
                    />
                  </td>
                  <td>
                    <select
                      className="cell-select"
                      value={row.manager_id}
                      onChange={e => update(row.id, 'manager_id', e.target.value)}
                    >
                      <option value="">— Root</option>
                      {rows.filter(r => r.id !== row.id).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="cell-checkbox"
                      checked={isOpen}
                      onChange={e => update(row.id, 'is_open', e.target.checked ? 'true' : 'false')}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      type="number"
                      min="1"
                      max="20"
                      value={row.cols || ''}
                      placeholder="auto"
                      title="Max direct reports per row"
                      onChange={e => update(row.id, 'cols', e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <button className="row-delete" onClick={() => deleteRow(row.id)} title="Remove">×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="sheet-footer">
        <button className="add-row-btn" onClick={addRow}>+ Add person</button>
        <span className="sheet-count">{rows.length} rows</span>
      </div>
    </div>
  )
}
