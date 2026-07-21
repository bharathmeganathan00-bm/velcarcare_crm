import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const FALLBACK_IMAGE = '/images/default-car.svg'

// One-time cleanup of old CarsXE cache keys (harmless if already gone).
try {
  if (typeof localStorage !== 'undefined') {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('carsxe-image') || k.startsWith('carsxe:') || k.startsWith('car-image-v'))
      .forEach((k) => localStorage.removeItem(k))
  }
} catch {
  /* ignore */
}

export interface CarModelImageProps {
  make: string
  model: string
  year?: number | string
  alt?: string
  className?: string
}

/**
 * Car model image via CarImagesAPI.
 *
 * The CarImagesAPI script (loaded in index.html) uses a MutationObserver to find
 * `img[data-ci-make]:not([data-ci-loaded])`, fetch the image, set `src`, and mark
 * `data-ci-loaded="true"` (or `"error"`). There is NO CI_REFRESH global — new
 * React nodes are picked up automatically, so we render the data-ci img with a
 * stable key (per make|model|year) and watch `data-ci-loaded` for the error case.
 */
export function CarModelImage({ make, model, year = 2022, alt, className }: CarModelImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const cacheKey = `${make}|${model}|${year}`
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // Reset when the target model changes.
  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [cacheKey])

  // Watch the result the CarImagesAPI script writes onto our <img>.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      if (el.getAttribute('data-ci-loaded') === 'error') setFailed(true)
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(el, { attributes: true, attributeFilter: ['data-ci-loaded', 'src'] })
    return () => obs.disconnect()
  }, [cacheKey])

  const altText = alt || `${make} ${model}`

  if (failed) {
    return <img src={FALLBACK_IMAGE} alt={altText} className={cn('h-full w-full object-contain', className)} />
  }

  return (
    <div className="relative h-full w-full">
      {!loaded && <div className="absolute inset-0 animate-pulse rounded-lg bg-slate-200" />}
      <img
        key={cacheKey}
        ref={ref}
        data-ci-make={make}
        data-ci-model={model}
        data-ci-year={String(year)}
        data-ci-width="600"
        alt={altText}
        loading="lazy"
        className={cn(
          'h-full w-full object-contain transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          e.currentTarget.onerror = null
          setFailed(true)
        }}
      />
    </div>
  )
}

export default CarModelImage
