CREATE TABLE IF NOT EXISTS order_photo_items (
  id               SERIAL PRIMARY KEY,
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  photo_url        TEXT NOT NULL,
  vehicle_brand    VARCHAR(100),
  vehicle_model    VARCHAR(100),
  manufacture_year VARCHAR(10),
  quantity         INT NOT NULL DEFAULT 1,
  note             TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);
