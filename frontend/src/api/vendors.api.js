import client from './client';

export const getVendors = () =>
  client.get('/vendors').then((r) => r.data);
