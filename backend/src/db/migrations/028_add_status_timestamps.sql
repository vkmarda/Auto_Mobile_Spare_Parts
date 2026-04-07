-- Orders: dedicated timestamp per state
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS accepted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatched_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at   TIMESTAMPTZ;

-- Return requests: dedicated timestamp per state
ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS accepted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatched_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at   TIMESTAMPTZ;
