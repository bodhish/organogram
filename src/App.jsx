import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import OrgChart from './components/OrgChart'
import CSVUploader from './components/CSVUploader'
import sampleCsv from './data/sample.csv?raw'

const parseCsv = (text) => Papa.parse(text, { header: true, skipEmptyLines: true }).data

export default function App() {
  const [rows, setRows] = useState(() => parseCsv(sampleCsv))
  const [filename, setFilename] = useState('sample.csv')
  const [error, setError] = useState(null)

  const handleFile = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setRows(data)
        setFilename(file.name)
        setError(null)
      },
      error: (err) => setError(err.message),
    })
  }, [])

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
          {filename && <span className="filename-badge">{filename}</span>}
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
