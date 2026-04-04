-- Expand return_requests status constraint to include all states
ALTER TABLE return_requests DROP CONSTRAINT IF EXISTS return_requests_status_check;
ALTER TABLE return_requests ADD CONSTRAINT return_requests_status_check
  CHECK (status IN (
    'return_requested',
    'return_accepted',
    'return_dispatched',
    'return_received',
    'return_settled',
    'return_cancelled'
  ));

-- Expand orders status constraint to include return_accepted (used by acceptReturn)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'rejected',
    'dispatched', 'delivered', 'confirmed',
    'return_requested', 'return_accepted', 'return_dispatched'
  ));
