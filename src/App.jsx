import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import OrgChart from './components/OrgChart'
import CSVUploader from './components/CSVUploader'
import sampleCsv from './data/sample.csv?raw'

const parseCsv = (text) => Papa.parse(text, { header: true, skipEmptyLines: true }).data

// URL-safe base64 encode/decode for UTF-8 strings
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

function readHashData() {
  const match = window.location.hash.match(/^#data=(.+)$/)
  if (!match) return null
  try { return decode(match[1]) } catch { return null }
}

function writeHashData(csvText) {
  history.replaceState(null, '', '#data=' + encode(csvText))
}

function initState() {
  const fromHash = readHashData()
  if (fromHash) {
    const rows = parseCsv(fromHash)
    if (rows.length > 0) return { rows, filename: 'shared link', fromHash: true }
  }
  return { rows: parseCsv(sampleCsv), filename: 'sample.csv', fromHash: false }
}

export default function App() {
  const [{ rows, filename, fromHash }, setState] = useState(initState)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleFile = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const csvText = [meta.fields.join(','), ...data.map(r => meta.fields.map(f => r[f]).join(','))].join('\n')
        writeHashData(csvText)
        setState({ rows: data, filename: file.name, fromHash: false })
        setError(null)
      },
      error: (err) => setError(err.message),
    })
  }, [])

  const copyLink = useCallback(() => {
    // Ensure the hash is set (sample data on first load has no hash yet)
    if (!fromHash && !window.location.hash.startsWith('#data=')) {
      writeHashData(sampleCsv)
    }
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [fromHash])

  return (
    <div className="app">
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
          {filename && (
            <span className="filename-badge" title={fromHash ? 'Loaded from shared link' : filename}>
              {fromHash ? '🔗 ' : ''}{filename}
            </span>
          )}
          <button className="copy-btn" onClick={copyLink} title="Copy shareable link">
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
          <CSVUploader onFile={handleFile} />
        </div>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}

      <main className="main">
        {rows.length > 0
          ? <OrgChart rows={rows} />
          : (
            <div className="empty-state">
              <p>Upload a CSV to visualise your org chart</p>
            </div>
          )
        }
      </main>
    </div>
  )
}
