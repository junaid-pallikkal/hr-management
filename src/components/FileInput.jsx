import { useRef } from 'react'
import { Upload } from 'lucide-react'
import Button from './Button'

// A button that opens the file picker. Returns the chosen file.
export default function FileInput({ label = 'Choose file', accept, onFile, loading = false, variant = 'secondary' }) {
  const ref = useRef(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
      <Button variant={variant} loading={loading} onClick={() => ref.current.click()}>
        <Upload />
        {label}
      </Button>
    </>
  )
}
