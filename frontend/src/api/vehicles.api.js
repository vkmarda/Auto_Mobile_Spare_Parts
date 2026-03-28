import client from './client';

export const getVehicleTypes = () =>
  client.get('/vehicles/vehicle-types').then((r) => r.data);

export const getBrands = (vehicleTypeId) =>
  client.get(`/vehicles/brands?vehicle_type_id=${vehicleTypeId}`).then((r) => r.data);

export const getModels = (brandId) =>
  client.get(`/vehicles/models?brand_id=${brandId}`).then((r) => r.data);

export const getCategories = () =>
  client.get('/vehicles/categories').then((r) => r.data);
