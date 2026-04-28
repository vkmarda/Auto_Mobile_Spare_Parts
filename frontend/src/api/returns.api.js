import client from './client';

export const getReturns = () =>
  client.get('/returns').then((r) => r.data);

export const acceptReturn = (id) =>
  client.post(`/returns/${id}/accept`).then((r) => r.data);

export const receiveReturn = (id) =>
  client.post(`/returns/${id}/receive`).then((r) => r.data);

export const settleReturn = (id) =>
  client.post(`/returns/${id}/settle`).then((r) => r.data);

export const createReturn = (data) =>
  client.post('/returns', data).then((r) => r.data);

export const cancelReturn = (orderId) =>
  client.post(`/returns/cancel/${orderId}`).then((r) => r.data);
