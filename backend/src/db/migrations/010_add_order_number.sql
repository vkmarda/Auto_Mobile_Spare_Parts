-- Add a sequence for order numbers
CREATE SEQUENCE order_number_seq START 1;

-- Add order_number column
ALTER TABLE orders ADD COLUMN order_number TEXT UNIQUE;

-- Generate order numbers for existing orders (oldest first)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM orders
)
UPDATE orders
SET order_number = 'ORD-' || LPAD(numbered.rn::TEXT, 3, '0')
FROM numbered
WHERE orders.id = numbered.id;

-- Create a function that auto-assigns order number on insert
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync the sequence to current max
SELECT setval('order_number_seq', (
  SELECT COUNT(*) FROM orders
));

-- Attach trigger to orders table
CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION assign_order_number();
