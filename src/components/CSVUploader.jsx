import { useRef } from 'react'

export default function CSVUploader({ onFile, label = 'Upload CSV', className = 'upload-btn' }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <>
      <button className={className} onClick={() => inputRef.current.click()}>
        {label}
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
