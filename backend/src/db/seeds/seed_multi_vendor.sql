-- =============================================================
-- SEED: Multi-vendor data for Parts Order Platform
-- Run this in Supabase SQL Editor
-- All vendor passwords = "password"
-- =============================================================

-- -------------------------------------------------------------
-- 1. VEHICLE TYPES (Bike & Scooter only)
-- -------------------------------------------------------------
INSERT INTO vehicle_types (name, slug) VALUES
  ('Bike',    'bike'),
  ('Scooter', 'scooter')
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------------
-- 2. BRANDS
-- -------------------------------------------------------------
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Honda',         'honda'         FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Yamaha',        'yamaha'        FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Bajaj',         'bajaj'         FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Hero',          'hero'          FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'TVS',           'tvs'           FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Royal Enfield', 'royal-enfield' FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'KTM',           'ktm'           FROM vehicle_types WHERE slug = 'bike' ON CONFLICT DO NOTHING;

INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Honda',  'honda-sc'  FROM vehicle_types WHERE slug = 'scooter' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'TVS',    'tvs-sc'    FROM vehicle_types WHERE slug = 'scooter' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Yamaha', 'yamaha-sc' FROM vehicle_types WHERE slug = 'scooter' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Suzuki', 'suzuki-sc' FROM vehicle_types WHERE slug = 'scooter' ON CONFLICT DO NOTHING;
INSERT INTO brands (vehicle_type_id, name, slug)
SELECT id, 'Bajaj',  'bajaj-sc'  FROM vehicle_types WHERE slug = 'scooter' ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- 3. MODELS
-- -------------------------------------------------------------
DO $$
DECLARE
  b_honda  UUID; b_yamaha UUID; b_bajaj UUID; b_hero UUID;
  b_tvs    UUID; b_re     UUID; b_ktm   UUID;
  b_honda_sc UUID; b_tvs_sc UUID; b_yamaha_sc UUID;
  b_suzuki_sc UUID; b_bajaj_sc UUID;
BEGIN
  SELECT id INTO b_honda      FROM brands WHERE slug = 'honda';
  SELECT id INTO b_yamaha     FROM brands WHERE slug = 'yamaha';
  SELECT id INTO b_bajaj      FROM brands WHERE slug = 'bajaj';
  SELECT id INTO b_hero       FROM brands WHERE slug = 'hero';
  SELECT id INTO b_tvs        FROM brands WHERE slug = 'tvs';
  SELECT id INTO b_re         FROM brands WHERE slug = 'royal-enfield';
  SELECT id INTO b_ktm        FROM brands WHERE slug = 'ktm';
  SELECT id INTO b_honda_sc   FROM brands WHERE slug = 'honda-sc';
  SELECT id INTO b_tvs_sc     FROM brands WHERE slug = 'tvs-sc';
  SELECT id INTO b_yamaha_sc  FROM brands WHERE slug = 'yamaha-sc';
  SELECT id INTO b_suzuki_sc  FROM brands WHERE slug = 'suzuki-sc';
  SELECT id INTO b_bajaj_sc   FROM brands WHERE slug = 'bajaj-sc';

  -- Honda Bikes
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_honda, 'CB Shine',    'cb-shine',    2006, NULL),
    (b_honda, 'CB Shine SP', 'cb-shine-sp', 2018, NULL),
    (b_honda, 'Unicorn 160', 'unicorn-160', 2015, NULL),
    (b_honda, 'CB300R',      'cb300r',      2019, NULL),
    (b_honda, 'Hornet 2.0',  'hornet-2',    2020, NULL),
    (b_honda, 'CB200X',      'cb200x',      2021, NULL)
  ON CONFLICT DO NOTHING;

  -- Yamaha Bikes
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_yamaha, 'FZ-S V3',    'fz-s-v3',  2019, NULL),
    (b_yamaha, 'FZ-X',       'fz-x',     2021, NULL),
    (b_yamaha, 'R15 V4',     'r15-v4',   2021, NULL),
    (b_yamaha, 'MT-15 V2',   'mt15-v2',  2022, NULL),
    (b_yamaha, 'R3',         'r3',        2015, NULL)
  ON CONFLICT DO NOTHING;

  -- Bajaj Bikes
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_bajaj, 'Pulsar NS200',    'pulsar-ns200',   2012, NULL),
    (b_bajaj, 'Pulsar N250',     'pulsar-n250',    2021, NULL),
    (b_bajaj, 'Dominar 400',     'dominar-400',    2017, NULL),
    (b_bajaj, 'CT100',           'ct100',          2004, NULL),
    (b_bajaj, 'Avenger Street',  'avenger-street', 2015, NULL)
  ON CONFLICT DO NOTHING;

  -- Hero Bikes
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_hero, 'Splendor Plus',   'splendor-plus', 2001, NULL),
    (b_hero, 'HF Deluxe',       'hf-deluxe',     2007, NULL),
    (b_hero, 'Xtreme 160R',     'xtreme-160r',   2020, NULL),
    (b_hero, 'Passion Pro',     'passion-pro',   2001, NULL),
    (b_hero, 'Xpulse 200',      'xpulse-200',    2019, NULL)
  ON CONFLICT DO NOTHING;

  -- TVS Bikes
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_tvs, 'Apache RTR 160 4V', 'apache-160-4v', 2018, NULL),
    (b_tvs, 'Apache RTR 200 4V', 'apache-200-4v', 2016, NULL),
    (b_tvs, 'Apache RR 310',     'apache-rr-310', 2017, NULL),
    (b_tvs, 'Raider 125',        'raider-125',    2021, NULL)
  ON CONFLICT DO NOTHING;

  -- Royal Enfield
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_re, 'Classic 350',      'classic-350',  2008, NULL),
    (b_re, 'Meteor 350',       'meteor-350',   2020, NULL),
    (b_re, 'Hunter 350',       'hunter-350',   2022, NULL),
    (b_re, 'Bullet 350',       'bullet-350',   1955, NULL),
    (b_re, 'Thunderbird 500',  'tb500',        2012, 2020)
  ON CONFLICT DO NOTHING;

  -- KTM
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_ktm, 'Duke 200',   'duke-200',  2012, NULL),
    (b_ktm, 'Duke 390',   'duke-390',  2013, NULL),
    (b_ktm, 'RC 390',     'rc-390',    2014, NULL)
  ON CONFLICT DO NOTHING;

  -- Scooters
  INSERT INTO models (brand_id, name, slug, year_from, year_to) VALUES
    (b_honda_sc,  'Activa 6G',    'activa-6g',    2020, NULL),
    (b_honda_sc,  'Activa 125',   'activa-125',   2013, NULL),
    (b_honda_sc,  'Dio',          'dio',          2001, NULL),
    (b_honda_sc,  'Grazia 125',   'grazia-125',   2018, NULL),
    (b_tvs_sc,    'Jupiter',      'jupiter',      2013, NULL),
    (b_tvs_sc,    'Ntorq 125',    'ntorq-125',    2018, NULL),
    (b_tvs_sc,    'iQube',        'iqube',        2020, NULL),
    (b_yamaha_sc, 'Fascino 125',  'fascino-125',  2020, NULL),
    (b_yamaha_sc, 'RayZR 125',    'rayzr-125',    2017, NULL),
    (b_suzuki_sc, 'Access 125',   'access-125',   2007, NULL),
    (b_suzuki_sc, 'Burgman 125',  'burgman-125',  2018, NULL),
    (b_bajaj_sc,  'Chetak',       'chetak',       2020, NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- -------------------------------------------------------------
-- 4. CATEGORIES
-- -------------------------------------------------------------
INSERT INTO categories (name, slug, icon) VALUES
  ('Engine Parts',   'engine-parts',  '⚙️'),
  ('Brakes',         'brakes',        '🛑'),
  ('Electrical',     'electrical',    '⚡'),
  ('Filters',        'filters',       '🔧'),
  ('Suspension',     'suspension',    '🔩'),
  ('Body Parts',     'body-parts',    '🏍️'),
  ('Tyres & Wheels', 'tyres-wheels',  '🛞'),
  ('Lighting',       'lighting',      '💡'),
  ('Transmission',   'transmission',  '⚙️'),
  ('Cooling System', 'cooling',       '❄️')
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------------
-- 5. VENDORS  (password = "password" for all)
-- -------------------------------------------------------------
INSERT INTO users (name, email, password, role, mobile, city, state, gst_number, is_approved) VALUES
  ('Sharma Auto Parts',          'sharma@purzaa.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'vendor', '9876541001', 'Mumbai', 'Maharashtra', '27AABCS1429B1Z1', true),
  ('Kumar Motors Supply',        'kumar@purzaa.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'vendor', '9876541002', 'Pune',   'Maharashtra', '27AABCK2341B1Z2', true),
  ('Singh Spares & Accessories', 'singh@purzaa.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'vendor', '9876541003', 'Nashik', 'Maharashtra', '27AABCS3452B1Z3', true)
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------------
-- 6. PRODUCTS per vendor
-- -------------------------------------------------------------
DO $$
DECLARE
  v_sharma  UUID; v_kumar UUID; v_singh UUID;
  c_engine  UUID; c_brakes UUID; c_elec  UUID; c_filters UUID;
  c_susp    UUID; c_body   UUID; c_tyres UUID; c_lighting UUID;
  c_trans   UUID; c_cool   UUID;
BEGIN
  SELECT id INTO v_sharma FROM users WHERE email = 'sharma@purzaa.com';
  SELECT id INTO v_kumar  FROM users WHERE email = 'kumar@purzaa.com';
  SELECT id INTO v_singh  FROM users WHERE email = 'singh@purzaa.com';

  SELECT id INTO c_engine   FROM categories WHERE slug = 'engine-parts';
  SELECT id INTO c_brakes   FROM categories WHERE slug = 'brakes';
  SELECT id INTO c_elec     FROM categories WHERE slug = 'electrical';
  SELECT id INTO c_filters  FROM categories WHERE slug = 'filters';
  SELECT id INTO c_susp     FROM categories WHERE slug = 'suspension';
  SELECT id INTO c_body     FROM categories WHERE slug = 'body-parts';
  SELECT id INTO c_tyres    FROM categories WHERE slug = 'tyres-wheels';
  SELECT id INTO c_lighting FROM categories WHERE slug = 'lighting';
  SELECT id INTO c_trans    FROM categories WHERE slug = 'transmission';
  SELECT id INTO c_cool     FROM categories WHERE slug = 'cooling';

  -- ============================================================
  -- SHARMA AUTO PARTS — Engine, Transmission & Filters
  -- ============================================================
  INSERT INTO products (name, sku, description, unit_price, stock, vendor_id, category_id) VALUES
    -- Engine
    ('Piston Kit Honda CB Shine 125cc',   'SAP-ENG-001', 'OEM grade piston kit with rings and pin',    850.00,  45, v_sharma, c_engine),
    ('Cylinder Head Gasket Honda Activa', 'SAP-ENG-002', 'Full metal head gasket for Activa 6G',       320.00,  80, v_sharma, c_engine),
    ('Crankshaft Assembly Bajaj Pulsar',  'SAP-ENG-003', 'Forged crankshaft, Pulsar NS200',           4200.00,  12, v_sharma, c_engine),
    ('Camshaft Bearing Set Yamaha FZ',    'SAP-ENG-004', 'Complete bearing set, FZ-S V3',              680.00,  35, v_sharma, c_engine),
    ('Valve Set Honda Unicorn 4pc',       'SAP-ENG-005', 'Inlet and exhaust valve set',                950.00,  28, v_sharma, c_engine),
    ('Engine Oil Seal Kit Bajaj CT100',   'SAP-ENG-006', 'Complete engine seal kit',                   420.00,  60, v_sharma, c_engine),
    ('Piston Ring Set RE Classic 350',    'SAP-ENG-007', 'STD bore piston ring set',                   580.00,  30, v_sharma, c_engine),
    ('Cylinder Liner Honda Activa 125',   'SAP-ENG-008', 'Chrome-plated cylinder liner',              1200.00,  18, v_sharma, c_engine),

    -- Transmission
    ('Gear Set Yamaha R15 V4',            'SAP-TRN-001', '6-speed gear set, complete assembly',       3800.00,   8, v_sharma, c_trans),
    ('Clutch Plate Set Honda CB300R',     'SAP-TRN-002', '6-friction plate clutch kit',               1200.00,  22, v_sharma, c_trans),
    ('Clutch Plate Set Bajaj Dominar',    'SAP-TRN-003', '7-friction plate heavy-duty kit',           1450.00,  18, v_sharma, c_trans),
    ('Gear Shift Fork RE Classic 350',    'SAP-TRN-004', 'Shift fork set, all positions',             2100.00,   5, v_sharma, c_trans),
    ('Drive Chain Kit Honda Shine 428',   'SAP-TRN-005', 'Chain + sprocket kit 428 series',            880.00,  40, v_sharma, c_trans),
    ('Sprocket Set TVS Apache 160',       'SAP-TRN-006', 'Front 14T + rear 40T steel sprockets',      650.00,  55, v_sharma, c_trans),
    ('Clutch Cable Honda Activa 6G',      'SAP-TRN-007', 'OEM spec clutch cable with adjuster',       180.00, 100, v_sharma, c_trans),
    ('Drive Belt TVS Ntorq 125',          'SAP-TRN-008', 'CVT drive belt, scooter',                   680.00,  35, v_sharma, c_trans),

    -- Filters
    ('Air Filter Honda Activa 6G',        'SAP-FLT-001', 'OEM replacement foam air filter',            180.00, 120, v_sharma, c_filters),
    ('Oil Filter Honda CB Shine',         'SAP-FLT-002', 'Spin-on type engine oil filter',              95.00, 200, v_sharma, c_filters),
    ('Air Filter Yamaha FZ-S V3',         'SAP-FLT-003', 'Panel type air filter',                      195.00,  90, v_sharma, c_filters),
    ('Fuel Filter Bajaj Pulsar NS200',    'SAP-FLT-004', 'Inline fuel filter cartridge',               145.00, 110, v_sharma, c_filters),
    ('Air Filter RE Classic 350',         'SAP-FLT-005', 'OEM spec paper element filter',              320.00,  65, v_sharma, c_filters),
    ('Oil Filter KTM Duke 200',           'SAP-FLT-006', 'Cartridge type oil filter',                  220.00,  75, v_sharma, c_filters),
    ('Air Filter TVS Jupiter',            'SAP-FLT-007', 'Foam air filter element',                    150.00, 130, v_sharma, c_filters)
  ON CONFLICT (sku) DO NOTHING;

  -- ============================================================
  -- KUMAR MOTORS SUPPLY — Brakes, Suspension & Electrical
  -- ============================================================
  INSERT INTO products (name, sku, description, unit_price, stock, vendor_id, category_id) VALUES
    -- Brakes
    ('Disc Brake Pad Set Honda CB300R',        'KMS-BRK-001', 'Sintered front disc brake pads',         480.00,  50, v_kumar, c_brakes),
    ('Disc Brake Pad Set Yamaha R15 V4',       'KMS-BRK-002', 'Semi-metallic compound front pads',      520.00,  45, v_kumar, c_brakes),
    ('Drum Brake Shoe Honda CB Shine',         'KMS-BRK-003', 'Rear drum brake shoe set',               220.00,  90, v_kumar, c_brakes),
    ('Brake Disc Rotor TVS Apache 200',        'KMS-BRK-004', 'Wave pattern 260mm front rotor',         980.00,  25, v_kumar, c_brakes),
    ('Brake Cable Set Hero Splendor',          'KMS-BRK-005', 'Front and rear brake cables pair',       180.00, 130, v_kumar, c_brakes),
    ('Master Cylinder Kit Bajaj Dominar',      'KMS-BRK-006', 'Front brake master cylinder assembly',  1850.00,  14, v_kumar, c_brakes),
    ('Drum Brake Shoe TVS Jupiter',            'KMS-BRK-007', 'Rear drum brake shoe set, scooter',      195.00,  85, v_kumar, c_brakes),
    ('Disc Brake Pad KTM Duke 390',            'KMS-BRK-008', 'Bybre OEM replacement pads front',       720.00,  30, v_kumar, c_brakes),
    ('Brake Lever Set Honda Activa 6G',        'KMS-BRK-009', 'Front and rear brake lever pair',        380.00,  60, v_kumar, c_brakes),

    -- Suspension
    ('Front Fork Oil Seal Kit Honda CB Shine', 'KMS-SUS-001', 'Fork oil seal and dust seal set',        420.00,  55, v_kumar, c_susp),
    ('Rear Shock Absorber Yamaha FZ-S',        'KMS-SUS-002', 'Monoshock rear unit',                   2400.00,  10, v_kumar, c_susp),
    ('Front Fork Assembly RE Classic 350',     'KMS-SUS-003', 'Complete telescopic fork unit pair',   14500.00,   4, v_kumar, c_susp),
    ('Steering Damper Bajaj Dominar 400',      'KMS-SUS-004', 'Hydraulic steering stabiliser',         3200.00,   7, v_kumar, c_susp),
    ('Rear Shock Absorber Honda Activa 6G',    'KMS-SUS-005', 'Twin rear shock absorber unit',         1800.00,  15, v_kumar, c_susp),
    ('Front Fork Leg TVS Apache RTR 160',      'KMS-SUS-006', 'Telescopic fork leg assembly each',     4200.00,   8, v_kumar, c_susp),
    ('Rear Monoshock KTM Duke 200',            'KMS-SUS-007', 'WP rear monoshock unit',                5500.00,   6, v_kumar, c_susp),
    ('Steering Head Bearing Set Universal',    'KMS-SUS-008', 'Tapered roller bearing set for stem',    280.00,  70, v_kumar, c_susp),

    -- Electrical
    ('Battery 12V 5Ah Honda Activa',           'KMS-ELC-001', 'Sealed MF battery, 5Ah',               1200.00,  35, v_kumar, c_elec),
    ('Battery 12V 9Ah RE Classic 350',         'KMS-ELC-002', 'Sealed MF battery, 9Ah',               1900.00,  20, v_kumar, c_elec),
    ('Rectifier Regulator Honda CB Shine',     'KMS-ELC-003', 'Voltage regulator unit',                 650.00,  42, v_kumar, c_elec),
    ('CDI Unit Bajaj Pulsar NS200',            'KMS-ELC-004', 'Digital CDI ignition module',           1350.00,  15, v_kumar, c_elec),
    ('Stator Coil Yamaha FZ-S V3',             'KMS-ELC-005', 'Alternator stator assembly',            2200.00,   8, v_kumar, c_elec),
    ('Starter Motor Honda Activa 6G',          'KMS-ELC-006', 'Electric start motor assembly',         2800.00,  12, v_kumar, c_elec),
    ('Ignition Switch Set Hero Splendor',      'KMS-ELC-007', 'Lock set with 2 keys',                   650.00,  45, v_kumar, c_elec),
    ('Spark Plug NGK CR8E Universal',          'KMS-ELC-008', 'NGK CR8E iridium spark plug',            180.00, 250, v_kumar, c_elec),
    ('Spark Plug Bosch FR8DC Universal',       'KMS-ELC-009', 'Bosch double copper spark plug',         145.00, 220, v_kumar, c_elec),
    ('Horn 12V Disc Type Universal',           'KMS-ELC-010', 'Disc type 12V horn 105dB',               220.00, 110, v_kumar, c_elec)
  ON CONFLICT (sku) DO NOTHING;

  -- ============================================================
  -- SINGH SPARES — Body, Tyres, Lighting & Cooling
  -- ============================================================
  INSERT INTO products (name, sku, description, unit_price, stock, vendor_id, category_id) VALUES
    -- Lighting
    ('Headlight Assembly Honda CB Shine',      'SSA-LGT-001', 'H4 halogen headlight unit complete',    1100.00,  30, v_singh, c_lighting),
    ('LED Headlight Bajaj Pulsar NS200',       'SSA-LGT-002', 'LED DRL + hi/lo beam unit',             2400.00,  18, v_singh, c_lighting),
    ('Tail Light Assembly Yamaha FZ-S V3',     'SSA-LGT-003', 'LED tail & brake light complete',        980.00,  25, v_singh, c_lighting),
    ('Turn Signal Set Honda Activa 4pc',       'SSA-LGT-004', 'Front and rear indicator set',           380.00,  70, v_singh, c_lighting),
    ('Headlight Bulb H4 60/55W',               'SSA-LGT-005', 'Halogen H4 bulb single',                  85.00, 300, v_singh, c_lighting),
    ('Projector Headlight RE Meteor 350',      'SSA-LGT-006', 'LED projector unit OEM spec',            3800.00,   9, v_singh, c_lighting),
    ('LED Tail Light TVS Apache RTR 160',      'SSA-LGT-007', 'LED sequential tail lamp',               1200.00,  22, v_singh, c_lighting),
    ('Headlight Assembly TVS Jupiter',         'SSA-LGT-008', 'LED headlight unit complete',            1450.00,  16, v_singh, c_lighting),
    ('Position Lamp Bajaj Pulsar (pair)',       'SSA-LGT-009', 'Front parking light pair',               320.00,  55, v_singh, c_lighting),

    -- Body Parts
    ('Front Fairing Honda CB300R Blue',        'SSA-BDY-001', 'ABS front nose fairing painted',        4200.00,   6, v_singh, c_body),
    ('Tank Cover Set RE Classic 350',          'SSA-BDY-002', 'Fuel tank side panels pair',             3500.00,   8, v_singh, c_body),
    ('Saree Guard TVS Jupiter',                'SSA-BDY-003', 'Stainless steel saree guard',             550.00,  45, v_singh, c_body),
    ('Front Mudguard Honda Activa 6G',         'SSA-BDY-004', 'Front wheel mudguard OEM',               680.00,  30, v_singh, c_body),
    ('Rear Mudguard Yamaha FZ-S V3',           'SSA-BDY-005', 'Rear fender assembly',                   720.00,  25, v_singh, c_body),
    ('Side Panel Set Bajaj Pulsar NS200',      'SSA-BDY-006', 'Left and right side cowl pair',         1800.00,  12, v_singh, c_body),
    ('Seat Assembly Hero Splendor Plus',       'SSA-BDY-007', 'Complete seat with foam and cover',     1400.00,  18, v_singh, c_body),
    ('Handlebar Honda CB Shine',               'SSA-BDY-008', 'Steel handlebar OEM spec',               580.00,  35, v_singh, c_body),
    ('Footrest Set Universal Bikes (pair)',    'SSA-BDY-009', 'Rubber footpeg set front pair',          280.00,  80, v_singh, c_body),

    -- Tyres & Wheels
    ('Tyre Honda CB Shine 100/80-17',          'SSA-TYR-001', 'MRF Nylogrip 100/80-17 rear',          1850.00,  20, v_singh, c_tyres),
    ('Tyre Yamaha R15 110/70-17 Front',        'SSA-TYR-002', 'MRF Revz CA 110/70-17 front',          2400.00,  15, v_singh, c_tyres),
    ('Tyre Yamaha R15 150/60-17 Rear',         'SSA-TYR-003', 'MRF Revz CB 150/60-17 rear',           3200.00,  12, v_singh, c_tyres),
    ('Alloy Wheel Honda Activa 12"',           'SSA-TYR-004', 'Tubeless alloy rim 12 inch',            3800.00,   8, v_singh, c_tyres),
    ('Tyre TVS Jupiter 90/100-10',             'SSA-TYR-005', 'TVS tyres 90/100-10 tubeless',         1650.00,  22, v_singh, c_tyres),
    ('Tyre RE Classic 110/90-19 Front',        'SSA-TYR-006', 'Ceat Zoom Cruz 110/90-19',              3400.00,  10, v_singh, c_tyres),
    ('Tyre RE Classic 130/70-18 Rear',         'SSA-TYR-007', 'Ceat Zoom Cruz 130/70-18',              3800.00,   9, v_singh, c_tyres),
    ('Tube 3.00-17 Bike Universal',            'SSA-TYR-008', 'Rubber inner tube 3.00-17',               220.00,  80, v_singh, c_tyres),
    ('Spoke Set 21" Universal (36pc)',         'SSA-TYR-009', 'Stainless steel spoke set with nipples', 480.00,  40, v_singh, c_tyres),

    -- Cooling
    ('Radiator Honda CB300R',                  'SSA-COL-001', 'Aluminium core radiator assembly',      8500.00,   5, v_singh, c_cool),
    ('Coolant Hose Kit RE Meteor 350',         'SSA-COL-002', 'Upper and lower radiator hose set',      850.00,  28, v_singh, c_cool),
    ('Radiator Fan Assembly KTM Duke 390',     'SSA-COL-003', 'Electric cooling fan with motor',       2800.00,   8, v_singh, c_cool),
    ('Coolant 1L Honda/Yamaha',                'SSA-COL-004', 'OEM spec ethylene glycol coolant',       380.00, 150, v_singh, c_cool),
    ('Thermostat Valve Bajaj Dominar 400',     'SSA-COL-005', 'Engine thermostat 75°C opening',         420.00,  35, v_singh, c_cool)
  ON CONFLICT (sku) DO NOTHING;

END $$;

-- -------------------------------------------------------------
-- 7. SAMPLE RETAILERS (password = "password" for all)
-- -------------------------------------------------------------
INSERT INTO users (name, email, password, role, mobile, city, state, is_approved) VALUES
  ('Ravi Motors',        'ravi@demo.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'retailer', '9876542001', 'Thane',      'Maharashtra', true),
  ('Patel Auto Store',   'patel@demo.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'retailer', '9876542002', 'Nashik',     'Maharashtra', true),
  ('Gupta Two-Wheelers', 'gupta@demo.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'retailer', '9876542003', 'Aurangabad', 'Maharashtra', true),
  ('Ali Spare Parts',    'ali@demo.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'retailer', '9876542004', 'Nagpur',     'Maharashtra', true),
  ('Joshi Auto Works',   'joshi@demo.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yc4W', 'retailer', '9876542005', 'Pune',       'Maharashtra', true)
ON CONFLICT (email) DO NOTHING;
