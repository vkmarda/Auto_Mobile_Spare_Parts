-- Remove price columns from everywhere
ALTER TABLE products    DROP COLUMN IF EXISTS unit_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS unit_price;
ALTER TABLE orders      DROP COLUMN IF EXISTS total_amount;
