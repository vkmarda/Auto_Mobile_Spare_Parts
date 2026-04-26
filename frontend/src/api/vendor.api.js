import client from './client';

export const getDemand = () =>
  client.get('/vendor/demand').then((r) => r.data);

export const getAllOrders = () =>
  client.get('/orders').then((r) => r.data);

export const acceptOrder = (id) =>
  client.post(`/orders/${id}/accept`).then((r) => r.data);

export const rejectOrder = (id, reason) =>
  client.post(`/orders/${id}/reject`, reason ? { reason } : {}).then((r) => r.data);

export const getStats = (days = 7) =>
  client.get(`/vendor/stats?days=${days}`).then((r) => r.data);

export const bulkAcceptOrders = (order_ids) =>
  client.post('/vendor/bulk-accept', { order_ids }).then((r) => r.data);

export const getSalesChart = (days = 7) =>
  client.get(`/vendor/chart?days=${days}`).then((r) => r.data);

export const getProductStats = (days = 7) =>
  client.get(`/vendor/product-stats?days=${days}`).then((r) => r.data);

export const dispatchOrder = (id) =>
  client.post(`/orders/${id}/dispatch`).then((r) => r.data);

export const deliverOrder = (id) =>
  client.post(`/orders/${id}/deliver`).then((r) => r.data);

export const getLastDispatchesByCity = () =>
  client.get('/vendor/last-dispatches').then((r) => r.data);

export const getRetailers = () =>
  client.get('/vendor/retailers').then((r) => r.data);

export const getRetailerById = (id) =>
  client.get(`/vendor/retailers/${id}`).then((r) => r.data);

export const getPendingCount = () =>
  client.get('/vendor/pending-count').then((r) => r.data.count);

export const getCityStats = (days = 7) =>
  client.get(`/vendor/city-stats?days=${days}`).then((r) => r.data);

export const getReturnsSummary = (days = 7) =>
  client.get(`/vendor/returns-summary?days=${days}`).then((r) => r.data);

export const partialAcceptOrder = (id, data) =>
  client.post(`/orders/${id}/partial-accept`, data).then((r) => r.data);
