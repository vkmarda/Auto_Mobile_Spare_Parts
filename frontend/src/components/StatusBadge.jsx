// Unified 6-group color schema:
// amber  = needs action (pending, return_requested)
// sky    = in progress  (accepted, return_accepted)
// violet = in motion    (dispatched, return_dispatched)
// teal   = arrived      (delivered, return_received)
// green  = done         (confirmed, return_settled)
// red    = rejected     gray = terminal/cancelled

const STYLES = {
  pending:           'bg-amber-100 text-amber-800',
  accepted:          'bg-sky-100 text-sky-800',
  rejected:          'bg-red-100 text-red-700',
  cancelled:         'bg-gray-100 text-gray-500',
  dispatched:        'bg-violet-100 text-violet-800',
  delivered:         'bg-teal-100 text-teal-800',
  confirmed:         'bg-green-100 text-green-800',
  return_requested:  'bg-amber-100 text-amber-800',
  return_accepted:   'bg-sky-100 text-sky-800',
  return_dispatched: 'bg-violet-100 text-violet-800',
  return_received:   'bg-teal-100 text-teal-800',
  return_settled:    'bg-green-100 text-green-800',
  return_cancelled:  'bg-gray-100 text-gray-500',
};

const DOTS = {
  pending:           'bg-amber-500',
  accepted:          'bg-sky-500',
  rejected:          'bg-red-500',
  cancelled:         'bg-gray-400',
  dispatched:        'bg-violet-500',
  delivered:         'bg-teal-500',
  confirmed:         'bg-green-500',
  return_requested:  'bg-amber-500',
  return_accepted:   'bg-sky-500',
  return_dispatched: 'bg-violet-500',
  return_received:   'bg-teal-500',
  return_settled:    'bg-green-500',
  return_cancelled:  'bg-gray-400',
};

const LABELS = {
  pending:           'Pending',
  accepted:          'Accepted',
  rejected:          'Rejected',
  cancelled:         'Cancelled',
  dispatched:        'Dispatched',
  delivered:         'Delivered',
  confirmed:         'Confirmed',
  return_requested:  'Return Requested',
  return_accepted:   'Return Accepted',
  return_dispatched: 'Return in Transit',
  return_received:   'Return Received',
  return_settled:    'Return Settled',
  return_cancelled:  'Return Cancelled',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOTS[status] || 'bg-gray-400'}`} />
      {label}
    </span>
  );
}
