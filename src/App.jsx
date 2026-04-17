import { useState, useCallback, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import OrgChart from './components/OrgChart'
import CSVUploader from './components/CSVUploader'
import DataSheet from './components/DataSheet'
import HomePage from './components/HomePage'
import sampleCsv from './data/sample.csv?raw'

const parseCsv = (text) => Papa.parse(text, { header: true, skipEmptyLines: true }).data

function encode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decode(b64) {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    b64.length + (4 - (b64.length % 4)) % 4, '='
  )
  return decodeURIComponent(
    Array.from(atob(padded), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  )
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function loadOrgs() {
  try { return JSON.parse(localStorage.getItem('organograms') || '[]') } catch { return [] }
}

function persistOrgs(orgs) {
  localStorage.setItem('organograms', JSON.stringify(orgs))
}

function getInitView() {
  const h = window.location.hash
  return (h.startsWith('#data=') || h.startsWith('#id=') || h === '#new') ? 'chart' : 'home'
}

function getInitChartState() {
  const h = window.location.hash
  if (h.startsWith('#data=')) {
    try {
      const csv = decode(h.slice(6))
      const rows = parseCsv(csv)
      if (rows.length > 0) return { id: null, title: 'Shared link', rows, csvText: csv, isDirty: false }
    } catch {}
  }
  if (h.startsWith('#id=')) {
    const id = h.slice(4)
    const org = loadOrgs().find(o => o.id === id)
    if (org) return { id: org.id, title: org.title, rows: parseCsv(org.csvText), csvText: org.csvText, isDirty: false }
  }
  if (h === '#new') {
    return { id: null, title: 'Untitled', rows: [], csvText: '', isDirty: false }
  }
  return null
}

export default function App() {
  const [view, setView] = useState(getInitView)
  const [chartState, setChartState] = useState(getInitChartState)
  const [orgs, setOrgs] = useState(loadOrgs)
  const [sheetOpen, setSheetOpen] = useState(() => window.location.hash === '#new')
  const [copied, setCopied] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef(null)

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select()
  }, [editingTitle])

  useEffect(() => {
    const handler = () => {
      const h = window.location.hash
      if (!h || h === '#' || h === '#home') {
        setView('home')
        setOrgs(loadOrgs())
        setChartState(null)
      } else if (h.startsWith('#id=')) {
        const id = h.slice(4)
        const org = loadOrgs().find(o => o.id === id)
        if (org) {
          setChartState({ id: org.id, title: org.title, rows: parseCsv(org.csvText), csvText: org.csvText, isDirty: false })
          setView('chart')
        }
      } else if (h.startsWith('#data=')) {
        try {
          const csv = decode(h.slice(6))
          const rows = parseCsv(csv)
          setChartState({ id: null, title: 'Shared link', rows, csvText: csv, isDirty: false })
          setView('chart')
        } catch {}
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const goHome = useCallback(() => {
    setView('home')
    setOrgs(loadOrgs())
    setSheetOpen(false)
    history.pushState(null, '', window.location.pathname)
  }, [])

  const openChart = useCallback((org) => {
    setChartState({ id: org.id, title: org.title, rows: parseCsv(org.csvText), csvText: org.csvText, isDirty: false })
    setView('chart')
    history.pushState(null, '', '#id=' + org.id)
  }, [])

  const newChart = useCallback(() => {
    setChartState({ id: null, title: 'Untitled', rows: [], csvText: '', isDirty: false })
    setView('chart')
    setSheetOpen(true)
    history.pushState(null, '', '#new')
  }, [])

  const handleRowsChange = useCallback((newRows) => {
    const csvText = Papa.unparse(newRows)
    setChartState(s => ({ ...s, rows: newRows, csvText, isDirty: true }))
  }, [])

  const handleTitleChange = useCallback((title) => {
    setChartState(s => ({ ...s, title, isDirty: true }))
  }, [])

  const saveChart = useCallback(() => {
    if (!chartState) return
    const now = Date.now()
    let updatedOrgs
    if (chartState.id) {
      updatedOrgs = orgs.map(o => o.id === chartState.id
        ? { ...o, title: chartState.title, csvText: chartState.csvText, rowCount: chartState.rows.length, updatedAt: now }
        : o
      )
      setChartState(s => ({ ...s, isDirty: false }))
    } else {
      const id = genId()
      const newOrg = { id, title: chartState.title || 'Untitled', csvText: chartState.csvText, rowCount: chartState.rows.length, createdAt: now, updatedAt: now }
      updatedOrgs = [newOrg, ...orgs]
      setChartState(s => ({ ...s, id, isDirty: false }))
      history.replaceState(null, '', '#id=' + id)
    }
    persistOrgs(updatedOrgs)
    setOrgs(updatedOrgs)
  }, [chartState, orgs])

  const duplicateChart = useCallback(() => {
    if (!chartState) return
    const now = Date.now()
    const id = genId()
    const newOrg = { id, title: chartState.title + ' (copy)', csvText: chartState.csvText, rowCount: chartState.rows.length, createdAt: now, updatedAt: now }
    const updatedOrgs = [newOrg, ...orgs]
    persistOrgs(updatedOrgs)
    setOrgs(updatedOrgs)
    setChartState({ id, title: newOrg.title, rows: chartState.rows, csvText: chartState.csvText, isDirty: false })
    history.pushState(null, '', '#id=' + id)
  }, [chartState, orgs])

  const duplicateOrg = useCallback((org) => {
    const now = Date.now()
    const id = genId()
    const newOrg = { id, title: org.title + ' (copy)', csvText: org.csvText, rowCount: org.rowCount, createdAt: now, updatedAt: now }
    const updatedOrgs = [newOrg, ...orgs]
    persistOrgs(updatedOrgs)
    setOrgs(updatedOrgs)
  }, [orgs])

  const deleteOrg = useCallback((id) => {
    const updatedOrgs = orgs.filter(o => o.id !== id)
    persistOrgs(updatedOrgs)
    setOrgs(updatedOrgs)
  }, [orgs])

  const handleFile = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const csvText = [meta.fields.join(','), ...data.map(r => meta.fields.map(f => r[f] ?? '').join(','))].join('\n')
        setChartState(s => s
          ? { ...s, rows: data, csvText, isDirty: true }
          : { id: null, title: file.name.replace(/\.csv$/i, ''), rows: data, csvText, isDirty: true }
        )
        setView('chart')
        if (!window.location.hash.startsWith('#id=')) history.pushState(null, '', '#new')
      },
    })
  }, [])

  const copyLink = useCallback(() => {
    if (!chartState) return
    const url = window.location.origin + window.location.pathname + '#data=' + encode(chartState.csvText)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [chartState])

  const loadSample = useCallback(() => {
    const rows = parseCsv(sampleCsv)
    setChartState({ id: null, title: 'Sample Org', rows, csvText: sampleCsv, isDirty: true })
    setView('chart')
    history.pushState(null, '', '#new')
  }, [])

  if (view === 'home') {
    return (
      <HomePage
        orgs={orgs}
        onOpen={openChart}
        onNew={newChart}
        onDelete={deleteOrg}
        onDuplicate={duplicateOrg}
        onFile={handleFile}
        onSample={loadSample}
      />
    )
  }

  const { title, rows, isDirty, id } = chartState

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={goHome}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Home
          </button>
          <div className="header-divider" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="title-input"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
            />
          ) : (
            <span className="chart-title" onClick={() => setEditingTitle(true)} title="Click to rename">
              {title || 'Untitled'}
              {isDirty && <span className="dirty-dot" title="Unsaved changes" />}
            </span>
          )}
        </div>

        <div className="header-right">
          <button className="copy-btn" onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy link'}</button>
          <button className="edit-btn" onClick={() => setSheetOpen(true)}>Edit Data</button>
          <button className="dup-btn" onClick={duplicateChart}>Duplicate</button>
          <button className={`save-btn${isDirty ? ' save-btn--dirty' : ''}`} onClick={saveChart}>
            {id ? 'Update' : 'Save'}
          </button>
          <CSVUploader onFile={handleFile} label="Import CSV" className="upload-btn" />
        </div>
      </header>

      {sheetOpen && (
        <>
          <div className="sheet-overlay" onClick={() => setSheetOpen(false)} />
          <DataSheet rows={rows} onChange={handleRowsChange} onClose={() => setSheetOpen(false)} />
        </>
      )}

      <main className="main">
        {rows.length > 0
          ? <OrgChart rows={rows} />
          : (
            <div className="empty-state">
              <p>No people yet</p>
              <button className="link-btn" onClick={() => setSheetOpen(true)}>Add people in Edit Data</button>
            </div>
          )
        }
      </main>
    </div>
  )
}
