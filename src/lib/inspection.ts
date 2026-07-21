/** Shared vehicle inspection checklist used in the customer wizard and invoice. */

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
