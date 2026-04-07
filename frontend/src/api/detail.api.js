import client from './client';

export const getOrderDetail  = (id) => client.get(`/details/orders/${id}/detail`).then((r) => r.data);
export const getReturnDetail = (id) => client.get(`/details/returns/${id}/detail`).then((r) => r.data);
