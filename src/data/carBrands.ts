/**
 * Car brand data + Logo.dev logo URLs.
 *
 * Logos come from Logo.dev:
 *   https://img.logo.dev/{domain}?token={VITE_LOGO_DEV_KEY}&size=200&format=png
 *
 * The publishable key is read from the environment — never hardcode it.
 */

export const DEFAULT_BRAND_LOGO = '/images/default-car-brand.svg'

const LOGO_DEV_KEY = import.meta.env.VITE_LOGO_DEV_KEY as string | undefined

/** True when a real Logo.dev key is configured (not the placeholder). */
export const hasLogoKey = Boolean(LOGO_DEV_KEY && !LOGO_DEV_KEY.includes('your_publishable'))

/** Build a Logo.dev PNG URL for a domain, or null when no key is set. */
export function brandLogoUrl(domain: string): string | null {
  if (!hasLogoKey) return null
  // retina=2x for crisp logos on high-DPI screens; format=png for transparency.
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_KEY}&size=200&format=png&retina=true`
}

export interface CarBrandInfo {
  name: string
  domain: string
  logo: string | null
}

const carBrandsData: { name: string; domain: string }[] = [
  { name: 'Maruti Suzuki', domain: 'marutisuzuki.com' },
  { name: 'Tata Motors', domain: 'tatamotors.com' },
  { name: 'Mahindra', domain: 'mahindra.com' },
  { name: 'Hyundai', domain: 'hyundai.com' },
  { name: 'Kia', domain: 'kia.com' },
  { name: 'Toyota', domain: 'toyota.com' },
  { name: 'Honda', domain: 'honda.com' },
  { name: 'MG Motor', domain: 'mgmotor.com' },
  { name: 'Renault', domain: 'renault.com' },
  { name: 'Nissan', domain: 'nissan-global.com' },
  { name: 'Skoda', domain: 'skoda-auto.com' },
  { name: 'Volkswagen', domain: 'volkswagen.com' },
  { name: 'Citroen', domain: 'citroen.com' },
  { name: 'Jeep', domain: 'jeep.com' },
  { name: 'Ford', domain: 'ford.com' },
  { name: 'Chevrolet', domain: 'chevrolet.com' },
  { name: 'Fiat', domain: 'fiat.com' },
  { name: 'BMW', domain: 'bmw.com' },
  { name: 'Mercedes-Benz', domain: 'mercedes-benz.com' },
  { name: 'Audi', domain: 'audi.com' },
  { name: 'Volvo', domain: 'volvocars.com' },
  { name: 'Lexus', domain: 'lexus.com' },
  { name: 'Land Rover', domain: 'landrover.com' },
  { name: 'Jaguar', domain: 'jaguar.com' },
  { name: 'Porsche', domain: 'porsche.com' },
  { name: 'Mini', domain: 'mini.com' },
  { name: 'Rolls-Royce', domain: 'rolls-roycemotorcars.com' },
  { name: 'Bentley', domain: 'bentleymotors.com' },
  { name: 'Ferrari', domain: 'ferrari.com' },
  { name: 'Lamborghini', domain: 'lamborghini.com' },
  { name: 'Maserati', domain: 'maserati.com' },
  { name: 'Aston Martin', domain: 'astonmartin.com' },
  { name: 'McLaren', domain: 'mclaren.com' },
  { name: 'Bugatti', domain: 'bugatti.com' },
  { name: 'Subaru', domain: 'subaru.com' },
  { name: 'Mazda', domain: 'mazda.com' },
  { name: 'Mitsubishi', domain: 'mitsubishi-motors.com' },
  { name: 'Suzuki', domain: 'globalsuzuki.com' },
  { name: 'Isuzu', domain: 'isuzu.co.jp' },
  { name: 'Tesla', domain: 'tesla.com' },
  { name: 'BYD', domain: 'byd.com' },
  { name: 'VinFast', domain: 'vinfastauto.com' },
  { name: 'Polestar', domain: 'polestar.com' },
  { name: 'Lotus', domain: 'lotuscars.com' },
  { name: 'Cadillac', domain: 'cadillac.com' },
  { name: 'GMC', domain: 'gmc.com' },
  { name: 'Dodge', domain: 'dodge.com' },
  { name: 'Chrysler', domain: 'chrysler.com' },
  { name: 'Ram', domain: 'ramtrucks.com' },
  { name: 'Peugeot', domain: 'peugeot.com' },
  { name: 'Opel', domain: 'opel.com' },
  { name: 'SEAT', domain: 'seat.com' },
  { name: 'Cupra', domain: 'cupraofficial.com' },
  { name: 'Genesis', domain: 'genesis.com' },
]

/** Full brand list with resolved logo URLs (for a standalone brand grid). */
export const carBrands: CarBrandInfo[] = carBrandsData.map((b) => ({
  ...b,
  logo: brandLogoUrl(b.domain),
}))

/**
 * Overrides for brands whose default domain returns a Logo.dev monogram
 * instead of the real logo. Verified against the live API.
 */
const DOMAIN_OVERRIDES: Record<string, string> = {
  renault: 'renault.co.in', // renault.com returns the "RG" monogram; .co.in has the real logo
  mg: 'mgmotor.co.in', // mgmotor.com returns a tiny/poor image; .co.in has the full logo
  isuzu: 'isuzu.in', // .co.jp works but the India site has a fuller logo
}

/**
 * name → domain map, including the aliases used by the built-in catalogue
 * (`src/data/carCatalogue.ts`) so those brands also resolve a logo.
 */
const NAME_TO_DOMAIN: Record<string, string> = {
  ...Object.fromEntries(carBrandsData.map((b) => [b.name.toLowerCase(), b.domain])),
  // Built-in catalogue aliases:
  tata: 'tatamotors.com',
  mg: 'mgmotor.com',
  datsun: 'datsun.com',
  'force motors': 'forcemotors.com',
  // Corrected domains (win over the above):
  ...DOMAIN_OVERRIDES,
}

/** Resolve a Logo.dev URL from a brand display name (null if unknown / no key). */
export function logoUrlForBrandName(name: string): string | null {
  const domain = NAME_TO_DOMAIN[name.trim().toLowerCase()]
  return domain ? brandLogoUrl(domain) : null
}
