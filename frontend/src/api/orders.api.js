import client from './client';

export const placeOrder = (data) =>
  client.post('/orders', data).then((r) => r.data);

export const getOrders = () =>
  client.get('/orders').then((r) => r.data);

export const getOrderById = (id) =>
  client.get(`/orders/${id}`).then((r) => r.data);

export const confirmOrder = (id) =>
  client.post(`/orders/${id}/confirm`).then((r) => r.data);

export const markDelivered = (id) =>
  client.post(`/orders/${id}/delivered`).then((r) => r.data);

export const placePhotoOrder = (data) =>
  client.post('/orders/photo', data).then((r) => r.data);
