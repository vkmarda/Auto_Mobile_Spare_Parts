ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
