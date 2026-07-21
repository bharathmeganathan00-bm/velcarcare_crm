import type { CarBrand, CarModel } from '@/lib/types'

/**
 * Built-in Indian car catalogue (old + current models).
 * This mirrors the `car_brands` / `car_models` tables and is used in demo mode
 * and as the seed source for the SQL migration. Images use a neutral car-icon
 * placeholder; the Manager can upload real images from Settings → Catalogue.
 */

export const CAR_BRANDS: CarBrand[] = [
  { id: 'b_maruti', name: 'Maruti Suzuki', country: 'India', popular: true, sort_order: 1 },
  { id: 'b_hyundai', name: 'Hyundai', country: 'South Korea', popular: true, sort_order: 2 },
  { id: 'b_tata', name: 'Tata', country: 'India', popular: true, sort_order: 3 },
  { id: 'b_mahindra', name: 'Mahindra', country: 'India', popular: true, sort_order: 4 },
  { id: 'b_toyota', name: 'Toyota', country: 'Japan', popular: true, sort_order: 5 },
  { id: 'b_honda', name: 'Honda', country: 'Japan', popular: true, sort_order: 6 },
  { id: 'b_kia', name: 'Kia', country: 'South Korea', popular: true, sort_order: 7 },
  { id: 'b_renault', name: 'Renault', country: 'France', popular: true, sort_order: 8 },
  { id: 'b_nissan', name: 'Nissan', country: 'Japan', sort_order: 9 },
  { id: 'b_ford', name: 'Ford', country: 'USA', sort_order: 10 },
  { id: 'b_vw', name: 'Volkswagen', country: 'Germany', sort_order: 11 },
  { id: 'b_skoda', name: 'Skoda', country: 'Czech Republic', sort_order: 12 },
  { id: 'b_mg', name: 'MG', country: 'UK', sort_order: 13 },
  { id: 'b_chevrolet', name: 'Chevrolet', country: 'USA', sort_order: 14 },
  { id: 'b_fiat', name: 'Fiat', country: 'Italy', sort_order: 15 },
  { id: 'b_datsun', name: 'Datsun', country: 'Japan', sort_order: 16 },
  { id: 'b_jeep', name: 'Jeep', country: 'USA', sort_order: 17 },
  { id: 'b_citroen', name: 'Citroen', country: 'France', sort_order: 18 },
  { id: 'b_isuzu', name: 'Isuzu', country: 'Japan', sort_order: 19 },
  { id: 'b_force', name: 'Force Motors', country: 'India', sort_order: 20 },
  { id: 'b_mitsubishi', name: 'Mitsubishi', country: 'Japan', sort_order: 21 },
  { id: 'b_mercedes', name: 'Mercedes-Benz', country: 'Germany', sort_order: 22 },
  { id: 'b_bmw', name: 'BMW', country: 'Germany', sort_order: 23 },
  { id: 'b_audi', name: 'Audi', country: 'Germany', sort_order: 24 },
  { id: 'b_volvo', name: 'Volvo', country: 'Sweden', sort_order: 25 },
  { id: 'b_landrover', name: 'Land Rover', country: 'UK', sort_order: 26 },
  { id: 'b_mini', name: 'Mini', country: 'UK', sort_order: 27 },
  { id: 'b_other', name: 'Other', country: '', sort_order: 99 },
]

function models(brandId: string, entries: [string, boolean?, boolean?][]): CarModel[] {
  // entries: [name, popular?, discontinued?]
  return entries.map(([model_name, popular, discontinued], i) => ({
    id: `${brandId}_m${i}`,
    brand_id: brandId,
    model_name,
    popular,
    discontinued,
  }))
}

export const CAR_MODELS: CarModel[] = [
  ...models('b_maruti', [
    ['800', false, true], ['Alto', true], ['Alto K10', true], ['Wagon R', true],
    ['Swift', true], ['Swift Dzire', true], ['Dzire', true], ['Ritz', false, true],
    ['Celerio', true], ['Baleno', true], ['Ertiga', true], ['Brezza', true],
    ['Vitara Brezza', false, true], ['S-Presso'], ['Ignis'], ['Eeco', true], ['Omni', false, true],
    ['Zen', false, true], ['Esteem', false, true], ['SX4', false, true], ['Ciaz', true],
    ['Grand Vitara'], ['Fronx'], ['Jimny'], ['Invicto'],
  ]),
  ...models('b_hyundai', [
    ['Santro', false, true], ['Santro Xing', false, true], ['i10', true], ['Grand i10', true],
    ['Grand i10 Nios', true], ['i20', true], ['Elite i20', false, true], ['Verna', true],
    ['Accent', false, true], ['Xcent', false, true], ['Aura'], ['Creta', true], ['Venue', true],
    ['Alcazar'], ['Tucson'], ['Elantra', false, true], ['Eon', false, true], ['Getz', false, true],
    ['Kona'], ['Exter', true],
  ]),
  ...models('b_tata', [
    ['Indica', false, true], ['Indigo', false, true], ['Nano', false, true], ['Vista', false, true],
    ['Manza', false, true], ['Bolt', false, true], ['Zest', false, true], ['Tiago', true],
    ['Tigor', true], ['Altroz', true], ['Punch', true], ['Nexon', true], ['Harrier', true],
    ['Safari', true], ['Sumo', false, true], ['Hexa', false, true], ['Aria', false, true], ['Curvv'],
  ]),
  ...models('b_mahindra', [
    ['Bolero', true], ['Scorpio', true], ['Scorpio N', true], ['XUV500', false, true],
    ['XUV300', true], ['XUV400'], ['XUV700', true], ['Thar', true], ['TUV300', false, true],
    ['KUV100', false, true], ['Marazzo'], ['Quanto', false, true], ['Verito', false, true],
  ]),
  ...models('b_toyota', [
    ['Qualis', false, true], ['Innova', true], ['Innova Crysta', true], ['Innova Hycross', true],
    ['Fortuner', true], ['Etios', false, true], ['Etios Liva', false, true], ['Corolla', false, true],
    ['Corolla Altis', false, true], ['Camry'], ['Glanza', true], ['Urban Cruiser'],
    ['Hyryder', true], ['Rumion'], ['Yaris', false, true],
  ]),
  ...models('b_honda', [
    ['City', true], ['Amaze', true], ['Jazz', false, true], ['Brio', false, true],
    ['Mobilio', false, true], ['BR-V', false, true], ['WR-V', false, true], ['Elevate', true],
    ['Civic', false, true], ['Accord', false, true], ['CR-V', false, true],
  ]),
  ...models('b_kia', [['Seltos', true], ['Sonet', true], ['Carens', true], ['Carnival'], ['EV6'], ['Syros']]),
  ...models('b_renault', [
    ['Kwid', true], ['Triber', true], ['Kiger', true], ['Duster', false, true],
    ['Lodgy', false, true], ['Fluence', false, true], ['Scala', false, true], ['Pulse', false, true],
  ]),
  ...models('b_nissan', [['Micra', false, true], ['Sunny', false, true], ['Magnite', true], ['Kicks', false, true], ['Terrano', false, true], ['Evalia', false, true]]),
  ...models('b_ford', [
    ['Figo', false, true], ['Fiesta', false, true], ['Classic', false, true], ['Ikon', false, true],
    ['Aspire', false, true], ['EcoSport', false, true], ['Endeavour', false, true], ['Freestyle', false, true],
  ]),
  ...models('b_vw', [['Polo', false, true], ['Vento', false, true], ['Virtus', true], ['Taigun', true], ['Tiguan'], ['Ameo', false, true]]),
  ...models('b_skoda', [['Rapid', false, true], ['Slavia', true], ['Kushaq', true], ['Octavia'], ['Superb'], ['Kodiaq']]),
  ...models('b_mg', [['Hector', true], ['Astor'], ['ZS EV'], ['Gloster'], ['Comet EV']]),
  ...models('b_chevrolet', [['Beat', false, true], ['Spark', false, true], ['Sail', false, true], ['Cruze', false, true], ['Tavera', false, true], ['Enjoy', false, true]]),
  ...models('b_jeep', [['Compass', true], ['Meridian'], ['Wrangler'], ['Grand Cherokee']]),
  ...models('b_citroen', [['C3', true], ['C3 Aircross'], ['C5 Aircross'], ['eC3']]),
  ...models('b_datsun', [['Go', false, true], ['Go+', false, true], ['Redi-Go', false, true]]),
  ...models('b_fiat', [['Punto', false, true], ['Linea', false, true], ['Palio', false, true]]),
  ...models('b_mercedes', [['C-Class'], ['E-Class'], ['GLC'], ['GLA'], ['S-Class']]),
  ...models('b_bmw', [['3 Series'], ['5 Series'], ['X1'], ['X3'], ['X5']]),
  ...models('b_audi', [['A4'], ['A6'], ['Q3'], ['Q5'], ['Q7']]),
  ...models('b_toyota', []),
]

export function modelsForBrand(brandId: string) {
  return CAR_MODELS.filter((m) => m.brand_id === brandId)
}
