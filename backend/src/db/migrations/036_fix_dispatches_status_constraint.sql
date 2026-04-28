-- Migrate any old 'delivered' dispatch rows to 'completed' first
UPDATE dispatches SET status = 'completed', updated_at = now() WHERE status = 'delivered';

-- Then replace the constraint with the correct set of values
ALTER TABLE dispatches DROP CONSTRAINT IF EXISTS dispatches_status_check;
ALTER TABLE dispatches ADD CONSTRAINT dispatches_status_check
  CHECK (status IN ('dispatched', 'completed'));
