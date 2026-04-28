-- Rename dispatch status 'delivered' to 'completed' to avoid confusion with order status
UPDATE dispatches SET status = 'completed', updated_at = now() WHERE status = 'delivered';
