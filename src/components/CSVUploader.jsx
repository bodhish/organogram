import { useRef } from 'react'

export default function CSVUploader({ onFile }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <>
      <button className="upload-btn" onClick={() => inputRef.current.click()}>
        Upload CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  )
}
