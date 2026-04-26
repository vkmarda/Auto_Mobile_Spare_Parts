// gray  = waiting / terminal-negative (pending, cancelled)
// indigo = in-progress (accepted, dispatched, all return_* except settled)
// green = terminal-positive (delivered, confirmed, return_settled)
// red   = rejected

const STYLES = {
  pending:              'bg-gray-100 text-gray-600',
  accepted:             'bg-indigo-100 text-indigo-800',
  partially_accepted:   'bg-orange-100 text-orange-800',
  partial_confirmed:    'bg-sky-100 text-sky-800',
  rejected:             'bg-red-100 text-red-700',
  cancelled:            'bg-gray-100 text-gray-500',
  dispatched:           'bg-indigo-100 text-indigo-800',
  delivered:            'bg-green-100 text-green-800',
  confirmed:            'bg-green-100 text-green-800',
  return_requested:     'bg-indigo-100 text-indigo-800',
  return_accepted:      'bg-indigo-100 text-indigo-800',
  return_dispatched:    'bg-indigo-100 text-indigo-800',
  return_received:      'bg-indigo-100 text-indigo-800',
  return_settled:       'bg-green-100 text-green-800',
  return_cancelled:     'bg-gray-100 text-gray-500',
};

const DOTS = {
  pending:              'bg-gray-400',
  accepted:             'bg-indigo-500',
  partially_accepted:   'bg-orange-500',
  partial_confirmed:    'bg-sky-500',
  rejected:             'bg-red-500',
  cancelled:            'bg-gray-400',
  dispatched:           'bg-indigo-500',
  delivered:            'bg-green-500',
  confirmed:            'bg-green-500',
  return_requested:     'bg-indigo-500',
  return_accepted:      'bg-indigo-500',
  return_dispatched:    'bg-indigo-500',
  return_received:      'bg-indigo-500',
  return_settled:       'bg-green-500',
  return_cancelled:     'bg-gray-400',
};

const LABELS = {
  pending:              'Pending',
  accepted:             'Accepted',
  partially_accepted:   'Partially Accepted',
  partial_confirmed:    'Partial Confirmed',
  rejected:             'Rejected',
  cancelled:            'Cancelled',
  dispatched:           'Dispatched',
  delivered:            'Delivered',
  confirmed:            'Confirmed',
  return_requested:     'Return Requested',
  return_accepted:      'Return Accepted',
  return_dispatched:    'Return in Transit',
  return_received:      'Return Received',
  return_settled:       'Return Settled',
  return_cancelled:     'Return Cancelled',
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
