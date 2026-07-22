/** Shared vehicle inspection checklist used in the customer wizard and invoice. */
import {
  Droplet,
  FlaskConical,
  Battery,
  CircleDot,
  Disc,
  Lightbulb,
  Megaphone,
  Snowflake,
  Waves,
  LifeBuoy,
  Cog,
  Settings,
  Wind,
  Droplets,
  Car,
  Armchair,
  type LucideIcon,
} from 'lucide-react'

export const INSPECTION_ITEMS = [
  'Engine Oil',
  'Coolant',
  'Battery',
  'Tyres',
  'Brakes',
  'Lights',
  'Horn',
  'AC',
  'Suspension',
  'Steering',
  'Clutch',
  'Gearbox',
  'Wipers',
  'Fluid Leakage',
  'Body Damage',
  'Interior Condition',
] as const

/** Automotive icon per checklist item (closest Lucide match). Shared everywhere. */
export const INSPECTION_ICONS: Record<string, LucideIcon> = {
  'Engine Oil': Droplet,
  Coolant: FlaskConical,
  Battery: Battery,
  Tyres: CircleDot,
  Brakes: Disc,
  Lights: Lightbulb,
  Horn: Megaphone,
  AC: Snowflake,
  Suspension: Waves,
  Steering: LifeBuoy,
  Clutch: Cog,
  Gearbox: Settings,
  Wipers: Wind,
  'Fluid Leakage': Droplets,
  'Body Damage': Car,
  'Interior Condition': Armchair,
}

export type InspectionStatus = 'good' | 'not'

/** Map of item → status. Defaults every item to "good" so staff only flip the bad ones. */
export type InspectionMap = Record<string, InspectionStatus>

export function defaultInspection(): InspectionMap {
  return Object.fromEntries(INSPECTION_ITEMS.map((i) => [i, 'good'])) as InspectionMap
}

/** Convert a map into an ordered array for saving / rendering. */
export function inspectionToArray(map: InspectionMap): { item: string; status: InspectionStatus }[] {
  return INSPECTION_ITEMS.filter((i) => map[i]).map((i) => ({ item: i, status: map[i] }))
}
