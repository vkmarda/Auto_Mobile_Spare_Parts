import client from './client';

export const createDispatch = (city = null, state = null) =>
  client.post('/dispatches', city ? { city, state } : {}).then((r) => r.data);

export const createDispatchForOrder = (orderId) =>
  client.post('/dispatches', { order_ids: [orderId] }).then((r) => r.data);

export const getDispatches = () =>
  client.get('/dispatches').then((r) => r.data);

export const getDispatchSheet = (id) =>
  client.get(`/dispatches/${id}/sheet`).then((r) => r.data);
