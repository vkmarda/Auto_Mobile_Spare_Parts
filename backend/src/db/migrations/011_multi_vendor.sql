-- Phase 1: Multi-vendor schema migration

-- Add vendor ownership to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id);

-- Add vendor assignment to orders (which vendor this order belongs to)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id);

-- Add GST and approval flow to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- All existing users are already active — approve them
UPDATE users SET is_approved = true;

-- Assign existing products and orders to the existing vendor (backward compat)
DO $$
DECLARE first_vendor_id UUID;
BEGIN
  SELECT id INTO first_vendor_id FROM users WHERE role = 'vendor' LIMIT 1;
  IF first_vendor_id IS NOT NULL THEN
    UPDATE products SET vendor_id = first_vendor_id WHERE vendor_id IS NULL;
    UPDATE orders  SET vendor_id = first_vendor_id WHERE vendor_id IS NULL;
  END IF;
END $$;
