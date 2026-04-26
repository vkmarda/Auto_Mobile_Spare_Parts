-- Fix vehicle_brand values that were incorrectly set during import.
-- Model names uniquely identify the manufacturer, so we correct brand by model.

-- Royal Enfield
UPDATE products SET vehicle_brand = 'Royal Enfield'
WHERE LOWER(vehicle_model) IN ('bullet', 'thunderbird', 'meteor', 'himalayan', 'hunter', 'enfield', 'classic', 'electra');

-- TVS
UPDATE products SET vehicle_brand = 'TVS'
WHERE LOWER(vehicle_model) IN ('apache rtr', 'apache rr', 'apache', 'centra', 'victor', 'max');

-- Honda
UPDATE products SET vehicle_brand = 'Honda'
WHERE LOWER(vehicle_model) IN ('unicorn', 'shine', 'livo', 'aviator', 'xblade', 'hornet', 'activa', 'activa 3g', 'dream', 'cb', 'cbr', 'dio');

-- Hero
UPDATE products SET vehicle_brand = 'Hero'
WHERE LOWER(vehicle_model) IN ('radeon', 'xpulse', 'destini', 'maestro', 'maestro edge', 'splendor', 'passion', 'glamour', 'pleasure', 'hf', 'achiever', 'ignitor', 'impulse', 'hero xtreme');

-- Suzuki
UPDATE products SET vehicle_brand = 'Suzuki'
WHERE LOWER(vehicle_model) IN ('gixxer', 'access', 'intruder', 'burgman');

-- Yamaha
UPDATE products SET vehicle_brand = 'Yamaha'
WHERE LOWER(vehicle_model) IN ('fz', 'fzs', 'fazer', 'r15', 'mt', 'saluto', 'alpha', 'ray');

-- Bajaj
UPDATE products SET vehicle_brand = 'Bajaj'
WHERE LOWER(vehicle_model) IN ('pulsar', 'discover', 'platina', 'avenger', 'boxer', 'ct', 'chetak');
