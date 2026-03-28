CREATE TABLE vehicle_types (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL
);

CREATE TABLE models (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id  UUID NOT NULL REFERENCES brands(id),
  name      TEXT NOT NULL,
  slug      TEXT NOT NULL,
  year_from INT,
  year_to   INT
);

CREATE TABLE categories (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT
);
