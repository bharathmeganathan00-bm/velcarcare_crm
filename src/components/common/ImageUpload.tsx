import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Label } from '@/components/ui/Input'

/**
 * Local image preview uploader. In live mode, wire `onFile` to Supabase Storage
 * (upload to a bucket, store the public URL on the record).
 */
export function ImageUpload({
  label,
  onFile,
}: {
  label?: string
  onFile?: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFile?.(file)
  }

  return (
    <div>
      {label && <Label>{label}</Label>}
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="preview" className="h-28 w-28 rounded-xl border border-surface-border object-cover" />
          <button
            onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-surface-border text-slate-400 hover:border-brand-red hover:text-brand-red transition"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-semibold">Upload</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  )
}
