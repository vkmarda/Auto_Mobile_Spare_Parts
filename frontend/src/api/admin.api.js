import client from './client';

export const getPendingVendors = () =>
  client.get('/admin/vendors/pending').then((r) => r.data);

export const getAllVendors = () =>
  client.get('/admin/vendors').then((r) => r.data);

export const approveVendor = (id) =>
  client.post(`/admin/vendors/${id}/approve`).then((r) => r.data);

export const getAllRetailers = () =>
  client.get('/admin/retailers').then((r) => r.data);
