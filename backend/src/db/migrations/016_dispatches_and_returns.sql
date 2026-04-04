-- Expand order status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','accepted','rejected','dispatched','delivered','confirmed','return_requested','return_dispatched'));

-- Dispatches
CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_number TEXT UNIQUE,
  vendor_id UUID REFERENCES users(id),
  city TEXT NOT NULL,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'dispatched',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE dispatch_number_seq START 1;

CREATE OR REPLACE FUNCTION assign_dispatch_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dispatch_number := 'DSP-' || LPAD(nextval('dispatch_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dispatch_number
BEFORE INSERT ON dispatches
FOR EACH ROW EXECUTE FUNCTION assign_dispatch_number();

CREATE TABLE dispatch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id)
);

-- Return requests
CREATE TABLE return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE,
  order_id UUID REFERENCES orders(id),
  retailer_id UUID REFERENCES users(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE return_number_seq START 1;

CREATE OR REPLACE FUNCTION assign_return_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.return_number := 'RET-' || LPAD(nextval('return_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_return_number
BEFORE INSERT ON return_requests
FOR EACH ROW EXECUTE FUNCTION assign_return_number();

CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Return deliveries (linked to a dispatch trip back)
CREATE TABLE return_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID REFERENCES dispatches(id),
  city TEXT NOT NULL,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE return_delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_delivery_id UUID REFERENCES return_deliveries(id) ON DELETE CASCADE,
  return_request_id UUID REFERENCES return_requests(id)
);
