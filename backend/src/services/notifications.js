// Notification service — currently stubs to console.log
// To activate WhatsApp notifications via MSG91:
//   1. Sign up at msg91.com and get an auth key
//   2. Create a WhatsApp template (e.g. "order_update")
//   3. Set MSG91_AUTH_KEY, MSG91_SENDER_NUMBER, MSG91_TEMPLATE_NAME in .env
//   4. Uncomment the axios block below and install axios (already in package.json)

const MESSAGES = {
  order_placed:             (d) => `New order ${d.order_number} from ${d.retailer_name} · ₹${d.total_amount}. Login to review.`,
  order_accepted:           (d) => `Your order ${d.order_number} has been accepted by ${d.vendor_name}. It will be dispatched soon.`,
  order_rejected:           (d) => `Your order ${d.order_number} was rejected by ${d.vendor_name}.`,
  order_dispatched:         (d) => `Your order ${d.order_number} has been dispatched. Expect delivery shortly.`,
  order_delivered:          (d) => `Your order ${d.order_number} has been delivered. Thank you!`,
  order_partially_accepted: (d) => `Your order ${d.order_number} has been partially accepted by ${d.vendor_name}. Please login to review the quantities and confirm.`,
};

const notify = async ({ mobile, event, data }) => {
  if (!mobile) return;
  const msgFn = MESSAGES[event];
  if (!msgFn) return;
  const message = msgFn(data);

  console.log(`[NOTIFY] ${event} → +91${mobile}: ${message}`);

  // MSG91 WhatsApp (uncomment to activate):
  // const axios = require('axios');
  // await axios.post(
  //   'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
  //   {
  //     integrated_number: process.env.MSG91_SENDER_NUMBER,
  //     content_type: 'template',
  //     payload: {
  //       to: `91${mobile}`,
  //       type: 'template',
  //       template: {
  //         name: process.env.MSG91_TEMPLATE_NAME || 'order_update',
  //         language: { code: 'en' },
  //         components: [{ type: 'body', parameters: [{ type: 'text', text: message }] }],
  //       },
  //     },
  //   },
  //   { headers: { authkey: process.env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' } }
  // );
};

module.exports = { notify };
