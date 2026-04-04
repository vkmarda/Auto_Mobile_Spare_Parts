-- Ensure orders status constraint includes all new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending','accepted','rejected',
    'dispatched','delivered','confirmed',
    'return_requested','return_dispatched'
  ));

-- Return requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE,
  order_id UUID REFERENCES orders(id),
  retailer_id UUID REFERENCES users(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'return_requested',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate any old 'pending' rows to 'return_requested'
UPDATE return_requests SET status = 'return_requested' WHERE status = 'pending';

-- Ensure default is correct if table already existed
ALTER TABLE return_requests ALTER COLUMN status SET DEFAULT 'return_requested';

-- Return number sequence (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'return_number_seq') THEN
    CREATE SEQUENCE return_number_seq START 1;
  END IF;
END $$;

-- Return number trigger function
CREATE OR REPLACE FUNCTION assign_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL THEN
    NEW.return_number := 'RET-' || LPAD(nextval('return_number_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Return number trigger (drop and recreate to be safe)
DROP TRIGGER IF EXISTS set_return_number ON return_requests;
CREATE TRIGGER set_return_number
BEFORE INSERT ON return_requests
FOR EACH ROW EXECUTE FUNCTION assign_return_number();

-- Return items table
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Return deliveries table
CREATE TABLE IF NOT EXISTS return_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID REFERENCES dispatches(id),
  city TEXT NOT NULL,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Return delivery requests table
CREATE TABLE IF NOT EXISTS return_delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_delivery_id UUID REFERENCES return_deliveries(id) ON DELETE CASCADE,
  return_request_id UUID REFERENCES return_requests(id)
);
