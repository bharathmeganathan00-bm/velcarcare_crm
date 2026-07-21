/**
 * Normalises the CRM's brand/model names to the names CarImagesAPI expects.
 * Keys are the brand names used in the built-in catalogue (`carCatalogue.ts`).
 * Used ONLY for the image request — customer-visible data never changes.
 */

// ---- Make (brand) name mapping ----
const makeMappings: Record<string, string> = {
  'Maruti Suzuki': 'Suzuki',
  'Tata Motors': 'Tata',
  Tata: 'Tata',
  'MG Motor': 'MG',
  MG: 'MG',
  'Mercedes Benz': 'Mercedes-Benz',
  'Mercedes-Benz': 'Mercedes-Benz',
  'Land Rover': 'Land Rover',
  'Rolls Royce': 'Rolls-Royce',
  'Rolls-Royce': 'Rolls-Royce',
  'Force Motors': 'Force',
}

export function getCarImageMake(brandName: string): string {
  return makeMappings[brandName] || brandName
}

// ---- Model name mapping (per brand) ----
const modelMappings: Record<string, Record<string, string>> = {
  'Maruti Suzuki': {
    'Swift Dzire': 'Swift',
    'Vitara Brezza': 'Brezza',
    'Alto K10': 'Alto',
  },
  Hyundai: {
    'Grand i10 Nios': 'Grand i10',
    'Elite i20': 'i20',
    'Santro Xing': 'Santro',
  },
}

export function getCarImageModel(brandName: string, modelName: string): string {
  return modelMappings[brandName]?.[modelName] || modelName
}

// ---- Year mapping (per brand/model) — used ONLY for image lookup ----
const modelYearMappings: Record<string, Record<string, number>> = {
  Renault: {
    Kwid: 2022,
    Triber: 2022,
    Kiger: 2022,
    Duster: 2020,
    Lodgy: 2018,
    Fluence: 2016,
    Scala: 2015,
    Pulse: 2016,
  },
  Hyundai: {
    Santro: 2019,
    'Santro Xing': 2014,
    i10: 2013,
    'Grand i10': 2018,
    'Grand i10 Nios': 2022,
    i20: 2022,
    Creta: 2022,
    Venue: 2022,
    Verna: 2022,
  },
  'Maruti Suzuki': {
    '800': 2010,
    Alto: 2012,
    'Alto K10': 2018,
    'Wagon R': 2020,
    Swift: 2022,
    'Swift Dzire': 2016,
    Dzire: 2022,
    Ritz: 2015,
    Celerio: 2022,
    Baleno: 2022,
    Ertiga: 2022,
    Brezza: 2022,
    'Vitara Brezza': 2020,
    'S-Presso': 2022,
    Ignis: 2022,
    Eeco: 2020,
    Omni: 2018,
    Zen: 2005,
    Esteem: 2007,
    SX4: 2013,
    Ciaz: 2022,
    'Grand Vitara': 2023,
    Fronx: 2023,
    Jimny: 2023,
    Invicto: 2023,
  },
}

export function getCarImageYear(
  brandName: string,
  modelName: string,
  providedYear?: string | number | null,
): string | number {
  if (providedYear) return providedYear
  return modelYearMappings[brandName]?.[modelName] || 2022
}
