const STYLES = {
  pending:           'bg-yellow-100 text-yellow-700',
  accepted:          'bg-blue-100 text-blue-700',
  rejected:          'bg-red-100 text-red-700',
  dispatched:        'bg-purple-100 text-purple-700',
  delivered:         'bg-orange-100 text-orange-700',
  confirmed:         'bg-green-100 text-green-700',
  return_requested:  'bg-amber-100 text-amber-700',
  return_accepted:   'bg-blue-100 text-blue-700',
  return_dispatched: 'bg-purple-100 text-purple-700',
  return_received:   'bg-teal-100 text-teal-700',
  return_settled:    'bg-green-100 text-green-700',
  return_cancelled:  'bg-gray-100 text-gray-500',
};

const LABELS = {
  pending:           'Pending',
  accepted:          'Accepted',
  rejected:          'Rejected',
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
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}
