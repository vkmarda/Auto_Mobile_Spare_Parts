import client from './client';

export const getProducts = (categoryId, vendorId, q, modelId) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', categoryId);
  if (vendorId)   params.set('vendor_id', vendorId);
  if (q)          params.set('q', q);
  if (modelId)    params.set('model_id', modelId);
  const qs = params.toString();
  return client.get(qs ? `/products?${qs}` : '/products').then((r) => r.data);
};

export const createProduct = (data) =>
  client.post('/products', data).then((r) => r.data);

export const updateProduct = (id, data) =>
  client.put(`/products/${id}`, data).then((r) => r.data);
