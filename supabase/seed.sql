-- ============================================================================
-- VELCARCARE CRM — Seed data
-- Run AFTER 0001_schema.sql and 0002_rls.sql.
-- NOTE: create the Manager auth user first (see README), then run 0003 to link
-- the profile. This file seeds settings + catalogue + services + parts.
-- ============================================================================

-- Company settings ----------------------------------------------------------
insert into company_settings (id, name, address, phones, whatsapp, email, logo_url,
  gst_enabled, gst_number, cgst_percent, sgst_percent, invoice_prefix, estimate_prefix, jobcard_prefix, upi_id, terms)
values (1, 'VELCARCARE',
  'No. 31/4B2, Chinnaiyankulam, Military Road, Kanchipuram – 631 501, Tamil Nadu',
  array['9787549179','7339477926'], '9787549179', 'velcarcarekpm@gmail.com', '/logo.svg',
  false, null, 9, 9, 'INV', 'EST', 'JC', 'velcarcare@upi',
  'Goods once sold will not be taken back. Warranty as per manufacturer terms.')
on conflict (id) do nothing;

-- Car brands -----------------------------------------------------------------
insert into car_brands (name, country, sort_order) values
  ('Maruti Suzuki','India',1),('Hyundai','South Korea',2),('Tata','India',3),
  ('Mahindra','India',4),('Toyota','Japan',5),('Honda','Japan',6),('Kia','South Korea',7),
  ('Renault','France',8),('Nissan','Japan',9),('Ford','USA',10),('Volkswagen','Germany',11),
  ('Skoda','Czech Republic',12),('MG','UK',13),('Chevrolet','USA',14),('Fiat','Italy',15),
  ('Datsun','Japan',16),('Jeep','USA',17),('Citroen','France',18),('Isuzu','Japan',19),
  ('Force Motors','India',20),('Mitsubishi','Japan',21),('Mercedes-Benz','Germany',22),
  ('BMW','Germany',23),('Audi','Germany',24),('Volvo','Sweden',25),('Land Rover','UK',26),
  ('Mini','UK',27),('Other','',99)
on conflict (name) do nothing;

-- Car models (subset of the built-in catalogue; app ships full list in src/data) --
insert into car_models (brand_id, model_name, discontinued)
select b.id, m.name, m.disc from car_brands b join (values
  ('Maruti Suzuki','Alto',false),('Maruti Suzuki','Alto K10',false),('Maruti Suzuki','Wagon R',false),
  ('Maruti Suzuki','Swift',false),('Maruti Suzuki','Swift Dzire',false),('Maruti Suzuki','Dzire',false),
  ('Maruti Suzuki','Celerio',false),('Maruti Suzuki','Baleno',false),('Maruti Suzuki','Ertiga',false),
  ('Maruti Suzuki','Brezza',false),('Maruti Suzuki','Eeco',false),('Maruti Suzuki','Ciaz',false),
  ('Maruti Suzuki','Grand Vitara',false),('Maruti Suzuki','Fronx',false),('Maruti Suzuki','Jimny',false),
  ('Maruti Suzuki','800',true),('Maruti Suzuki','Omni',true),('Maruti Suzuki','Zen',true),('Maruti Suzuki','Esteem',true),
  ('Hyundai','Santro',true),('Hyundai','i10',false),('Hyundai','Grand i10 Nios',false),('Hyundai','i20',false),
  ('Hyundai','Verna',false),('Hyundai','Aura',false),('Hyundai','Creta',false),('Hyundai','Venue',false),
  ('Hyundai','Alcazar',false),('Hyundai','Tucson',false),('Hyundai','Exter',false),('Hyundai','Eon',true),('Hyundai','Getz',true),
  ('Tata','Tiago',false),('Tata','Tigor',false),('Tata','Altroz',false),('Tata','Punch',false),
  ('Tata','Nexon',false),('Tata','Harrier',false),('Tata','Safari',false),('Tata','Curvv',false),
  ('Tata','Indica',true),('Tata','Indigo',true),('Tata','Nano',true),('Tata','Sumo',true),
  ('Mahindra','Bolero',false),('Mahindra','Scorpio',false),('Mahindra','Scorpio N',false),('Mahindra','XUV300',false),
  ('Mahindra','XUV400',false),('Mahindra','XUV700',false),('Mahindra','Thar',false),('Mahindra','Marazzo',false),
  ('Mahindra','XUV500',true),('Mahindra','TUV300',true),('Mahindra','KUV100',true),
  ('Toyota','Innova',false),('Toyota','Innova Crysta',false),('Toyota','Innova Hycross',false),('Toyota','Fortuner',false),
  ('Toyota','Glanza',false),('Toyota','Hyryder',false),('Toyota','Rumion',false),('Toyota','Camry',false),
  ('Toyota','Qualis',true),('Toyota','Etios',true),('Toyota','Corolla Altis',true),
  ('Honda','City',false),('Honda','Amaze',false),('Honda','Elevate',false),
  ('Honda','Jazz',true),('Honda','Brio',true),('Honda','WR-V',true),('Honda','Civic',true),
  ('Kia','Seltos',false),('Kia','Sonet',false),('Kia','Carens',false),('Kia','Carnival',false),('Kia','Syros',false),
  ('Renault','Kwid',false),('Renault','Triber',false),('Renault','Kiger',false),('Renault','Duster',true),('Renault','Lodgy',true),
  ('Nissan','Magnite',false),('Nissan','Micra',true),('Nissan','Sunny',true),('Nissan','Terrano',true),
  ('Ford','Figo',true),('Ford','Aspire',true),('Ford','EcoSport',true),('Ford','Endeavour',true),
  ('Volkswagen','Virtus',false),('Volkswagen','Taigun',false),('Volkswagen','Polo',true),('Volkswagen','Vento',true),
  ('Skoda','Slavia',false),('Skoda','Kushaq',false),('Skoda','Rapid',true),('Skoda','Octavia',false),
  ('MG','Hector',false),('MG','Astor',false),('MG','ZS EV',false),('MG','Comet EV',false),
  ('Chevrolet','Beat',true),('Chevrolet','Spark',true),('Chevrolet','Cruze',true),('Chevrolet','Tavera',true),
  ('Jeep','Compass',false),('Jeep','Meridian',false),
  ('Citroen','C3',false),('Citroen','C3 Aircross',false)
) as m(brand,name,disc) on b.name = m.brand
on conflict (brand_id, model_name) do nothing;

-- Service master -------------------------------------------------------------
insert into service_master (name, category, labour_charge, duration_mins, tax_percent) values
  ('General Service','General Service',800,90,18),
  ('Oil Change','Oil and Filters',300,30,18),
  ('Wheel Alignment','Wheel Alignment',600,45,18),
  ('AC Service','AC',1200,60,18),
  ('Brake Service','Brake',700,60,18),
  ('Clutch Overhaul','Clutch',2500,180,18),
  ('Battery Check & Replace','Battery',200,20,18),
  ('Full Body Wash','Washing',350,40,18),
  ('Interior Detailing','Detailing',1500,120,18),
  ('Engine Diagnostics','Diagnostics',500,45,18),
  ('Denting & Painting (per panel)','Painting',2000,240,18),
  ('Suspension Work','Suspension',1800,150,18)
on conflict do nothing;

-- Spare part categories ------------------------------------------------------
insert into spare_part_categories (name, sort_order) values
  ('Engine',1),('Filters',2),('Brake',3),('Suspension',4),('Steering',5),
  ('Clutch and Transmission',6),('Electrical',7),('Battery',8),('AC',9),
  ('Fuel',10),('Body',11),('Tyres and Wheels',12),('Fluids',13),('Consumables',14)
on conflict (name) do nothing;

-- Sample spare parts ---------------------------------------------------------
insert into spare_parts (name, category, part_number, unit, purchase_price, selling_price, gst, opening_qty, current_qty, min_qty, rack_location, warranty) values
  ('Engine Oil 5W30','Fluids','EO-5W30-1L','Litre',320,450,18,2,2,6,'A1','—'),
  ('Oil Filter','Filters','OF-1042','Piece',120,180,18,3,3,8,'B2','—'),
  ('Air Filter','Filters','AF-2210','Piece',170,250,18,4,4,8,'B3','—'),
  ('Cabin AC Filter','Filters','CF-330','Piece',150,240,18,10,10,6,'B4','—'),
  ('Front Brake Pad Set','Brake','BP-F-556','Set',620,950,18,1,1,5,'C1','6 months'),
  ('Rear Brake Shoe','Brake','BS-R-221','Set',380,600,18,5,5,4,'C2','6 months'),
  ('Car Battery 35AH','Battery','BAT-35AH','Piece',3800,4600,18,2,2,4,'D1','24 months'),
  ('Spark Plug','Electrical','SP-778','Piece',85,120,18,6,6,12,'E2','—'),
  ('Wiper Blade','Body','WB-18','Piece',180,280,18,14,14,6,'F1','—'),
  ('Coolant 1L','Fluids','CL-1L','Litre',140,210,18,9,9,6,'A2','—'),
  ('Clutch Plate','Clutch and Transmission','CP-990','Piece',1800,2600,18,2,2,3,'G1','12 months'),
  ('Shock Absorber Front','Suspension','SA-F-140','Piece',1200,1750,18,3,3,4,'H1','12 months')
on conflict do nothing;

-- Record opening stock movements
insert into stock_movements (part_id, movement_type, qty, prev_qty, new_qty, ref_type, note)
select id, 'opening', current_qty, 0, current_qty, 'seed', 'Opening stock' from spare_parts;
