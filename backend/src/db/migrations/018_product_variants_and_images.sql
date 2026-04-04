-- model_variants: each model can have multiple BS6/BS4 variants
CREATE TABLE IF NOT EXISTS model_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id          UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  emission_standard TEXT,          -- BS6, BS4, BS3, Any
  engine_cc         INT,
  fuel_type         TEXT,          -- FI, Carburettor
  year_from         INT,
  year_to           INT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- product_images: multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, image_url)
);

-- product_variants: many-to-many between products and model_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  model_variant_id UUID NOT NULL REFERENCES model_variants(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, model_variant_id)
);

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand           TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_brand   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_model   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_variant   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_type_detail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS emission_standard   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags            TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url      TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS part_name       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS handle          TEXT UNIQUE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id       ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_model_variant_id ON product_variants(model_variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id         ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_model_variants_model_id           ON model_variants(model_id);
CREATE INDEX IF NOT EXISTS idx_products_vehicle_brand            ON products(vehicle_brand);
CREATE INDEX IF NOT EXISTS idx_products_category_id              ON products(category_id);
