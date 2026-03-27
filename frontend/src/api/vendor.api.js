import client from './client';

export const getDemand = () =>
  client.get('/vendor/demand').then((r) => r.data);

export const getAllOrders = () =>
  client.get('/orders').then((r) => r.data);

export const acceptOrder = (id) =>
  client.post(`/orders/${id}/accept`).then((r) => r.data);

export const rejectOrder = (id) =>
  client.post(`/orders/${id}/reject`).then((r) => r.data);

export const getStats = (days = 7) =>
  client.get(`/vendor/stats?days=${days}`).then((r) => r.data);

export const bulkAcceptOrders = (order_ids) =>
  client.post('/vendor/bulk-accept', { order_ids }).then((r) => r.data);
