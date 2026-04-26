-- Seed 10 pending orders with varying ages to test urgency color-coding.
-- Run this in the Supabase SQL editor.
-- Orders will be: today, 1d, 2d, 3d, 4d, 5d, 6d, 7d, 8d, 10d old.

DO $$
DECLARE
  v_vendor_id     UUID;
  r1 UUID; r2 UUID; r3 UUID; r4 UUID; r5 UUID;
  p1 UUID; p2 UUID; p3 UUID; p4 UUID; p5 UUID;
  oid UUID;
BEGIN
  SELECT id INTO v_vendor_id FROM users WHERE email = 'vendor@parts.com';
  IF v_vendor_id IS NULL THEN
    SELECT id INTO v_vendor_id FROM users WHERE role = 'vendor' LIMIT 1;
  END IF;

  SELECT id INTO r1 FROM users WHERE role = 'retailer' ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO r2 FROM users WHERE role = 'retailer' ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO r3 FROM users WHERE role = 'retailer' ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO r4 FROM users WHERE role = 'retailer' ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO r5 FROM users WHERE role = 'retailer' ORDER BY created_at LIMIT 1 OFFSET 4;

  -- Fall back to r1 if some retailers don't exist
  IF r2 IS NULL THEN r2 := r1; END IF;
  IF r3 IS NULL THEN r3 := r1; END IF;
  IF r4 IS NULL THEN r4 := r1; END IF;
  IF r5 IS NULL THEN r5 := r1; END IF;

  SELECT id INTO p1 FROM products ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO p2 FROM products ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO p3 FROM products ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO p4 FROM products ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO p5 FROM products ORDER BY created_at LIMIT 1 OFFSET 4;

  -- Order 1: Today (gray — fresh)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r1, v_vendor_id, 'pending', 'Urgent restock', now(), now())
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p1, 3, 'Honda', 'Activa');

  -- Order 2: 1 day old (gray)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r2, v_vendor_id, 'pending', NULL, now() - interval '1 day', now() - interval '1 day')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p2, 4, 'Bajaj', 'Pulsar 150');

  -- Order 3: 2 days old (gray)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r3, v_vendor_id, 'pending', NULL, now() - interval '2 days', now() - interval '2 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p3, 6, 'TVS', 'Jupiter');

  -- Order 4: 3 days old (orange — threshold)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r4, v_vendor_id, 'pending', 'Please process asap', now() - interval '3 days', now() - interval '3 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p1, 2, 'Hero', 'Splendor');
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p4, 3, 'Hero', 'Splendor');

  -- Order 5: 4 days old (orange)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r5, v_vendor_id, 'pending', NULL, now() - interval '4 days', now() - interval '4 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p2, 5, 'Yamaha', 'FZ');

  -- Order 6: 5 days old (red — threshold)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r1, v_vendor_id, 'pending', 'Waiting since last week', now() - interval '5 days', now() - interval '5 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p5, 2, 'Suzuki', 'Access');

  -- Order 7: 6 days old (red)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r2, v_vendor_id, 'pending', NULL, now() - interval '6 days', now() - interval '6 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p3, 4, 'Honda', 'Shine');

  -- Order 8: 7 days old (red)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r3, v_vendor_id, 'pending', 'Critical — shop halted', now() - interval '7 days', now() - interval '7 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p4, 7, 'Bajaj', 'Discover');

  -- Order 9: 8 days old (red)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r4, v_vendor_id, 'pending', NULL, now() - interval '8 days', now() - interval '8 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p1, 2, 'TVS', 'Apache');

  -- Order 10: 10 days old (red — very overdue)
  INSERT INTO orders (retailer_id, vendor_id, status, notes, created_at, updated_at)
  VALUES (r5, v_vendor_id, 'pending', 'Follow up multiple times', now() - interval '10 days', now() - interval '10 days')
  RETURNING id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p2, 5, 'Royal Enfield', 'Classic 350');
  INSERT INTO order_items (order_id, product_id, quantity, vehicle_brand, vehicle_model)
  VALUES (oid, p5, 6, 'Royal Enfield', 'Classic 350');

  RAISE NOTICE 'Seeded 10 sample orders (today → 10d ago) for vendor %', v_vendor_id;
END $$;
