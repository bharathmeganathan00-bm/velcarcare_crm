import { useState } from 'react'
import { Car, Check, Plus } from 'lucide-react'
import type { CarBrand, CarModel, ServiceItem, SparePart } from '@/lib/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DEFAULT_BRAND_LOGO, logoUrlForBrandName } from '@/data/carBrands'
import { CarModelImage } from '@/components/cars/CarModelImage'
import { getCarImageMake, getCarImageModel, getCarImageYear } from '@/utils/carImageMappings'
import { formatCurrency, cn } from '@/lib/utils'

/** Brand logo with skeleton loading, error fallback and initials as last resort. */
function BrandLogo({ name, url }: { name: string; url: string | null }) {
  const [src, setSrc] = useState(url ?? DEFAULT_BRAND_LOGO)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(!url) // no url → straight to initials

  return (
    <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-surface-border">
      {!loaded && !failed && <span className="skeleton absolute inset-0 rounded-xl" />}
      {failed ? (
        <span className="text-lg font-extrabold text-brand-charcoal">{name.slice(0, 2)}</span>
      ) : (
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          className={cn('h-full w-full object-contain p-1.5 transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setLoaded(true)}
          onError={() => {
            // First failure → default image; if that also fails → initials.
            if (src !== DEFAULT_BRAND_LOGO) setSrc(DEFAULT_BRAND_LOGO)
            else setFailed(true)
          }}
        />
      )}
    </span>
  )
}

/** Brand tile with a real logo, selected state and hover/press animation. */
export function CarBrandCard({
  brand,
  selected,
  onClick,
}: {
  brand: CarBrand
  selected?: boolean
  onClick?: () => void
}) {
  const url = brand.logo_url || logoUrlForBrandName(brand.name)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 transition-all duration-150 active:scale-95',
        selected
          ? 'border-brand-red bg-brand-redLight/40 ring-2 ring-brand-red/20 shadow-cardHover'
          : 'border-surface-border hover:-translate-y-0.5 hover:shadow-cardHover',
      )}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <BrandLogo name={brand.name} url={url} />
      <span className="text-center text-xs font-semibold leading-tight text-slate-700">{brand.name}</span>
    </button>
  )
}

/** Model card with a real CarImagesAPI vehicle image + discontinued indicator. */
export function CarModelCard({
  model,
  make,
  selected,
  onClick,
}: {
  model: CarModel
  /** Brand display name — enables the CarImagesAPI vehicle image. */
  make?: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-150 active:scale-[0.98]',
        selected
          ? 'border-brand-red ring-2 ring-brand-red/20 shadow-cardHover'
          : 'border-surface-border hover:-translate-y-1 hover:shadow-cardHover',
      )}
    >
      {model.discontinued && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
          OLD
        </span>
      )}
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50 p-2">
        {make ? (
          <CarModelImage
            make={getCarImageMake(make)}
            model={getCarImageModel(make, model.model_name)}
            year={getCarImageYear(make, model.model_name, model.launched_year)}
            alt={`${make} ${model.model_name}`}
          />
        ) : model.image_url ? (
          <img src={model.image_url} alt={model.model_name} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car className="h-8 w-8 text-slate-300" />
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-bold text-brand-charcoal">{model.model_name}</p>
        {model.body_type && <p className="truncate text-xs text-slate-400">{model.body_type}</p>}
      </div>
    </button>
  )
}

/** Spare part card with image, price, stock and add button. */
export function SparePartCard({
  part,
  qty = 0,
  onAdd,
}: {
  part: SparePart
  qty?: number
  onAdd?: () => void
}) {
  const low = part.current_qty <= part.min_qty
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-3">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-muted">
        {part.image_url ? (
          <img src={part.image_url} alt={part.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-slate-400">{part.category.slice(0, 3).toUpperCase()}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-charcoal">{part.name}</p>
        <p className="truncate text-xs text-slate-400">{part.part_number}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-extrabold text-brand-red">{formatCurrency(part.selling_price)}</span>
          <StatusBadge tone={low ? 'low' : 'success'}>Stock: {part.current_qty}</StatusBadge>
        </div>
      </div>
      <button
        onClick={onAdd}
        className={cn(
          'flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-bold transition active:scale-95',
          qty > 0 ? 'bg-status-success text-white' : 'bg-brand-redLight text-brand-red hover:bg-brand-red/15',
        )}
      >
        {qty > 0 ? (
          <>
            <Check className="h-4 w-4" /> {qty}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add
          </>
        )}
      </button>
    </div>
  )
}

/** Service selection card. */
export function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: ServiceItem
  selected?: boolean
  onToggle?: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition active:scale-[0.98]',
        selected ? 'border-brand-red ring-2 ring-brand-red/15' : 'border-surface-border hover:shadow-cardHover',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md border-2 transition',
          selected ? 'border-brand-red bg-brand-red text-white' : 'border-slate-300',
        )}
      >
        {selected && <Check className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-charcoal">{service.name}</p>
        <p className="truncate text-xs text-slate-400">{service.category}</p>
      </div>
      <span className="text-sm font-extrabold text-brand-charcoal">{formatCurrency(service.labour_charge)}</span>
    </button>
  )
}
