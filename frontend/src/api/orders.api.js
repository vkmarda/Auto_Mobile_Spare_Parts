import client from './client';

export const placeOrder = (data) =>
  client.post('/orders', data).then((r) => r.data);

export const getOrders = () =>
  client.get('/orders').then((r) => r.data);

export const getOrderById = (id) =>
  client.get(`/orders/${id}`).then((r) => r.data);
