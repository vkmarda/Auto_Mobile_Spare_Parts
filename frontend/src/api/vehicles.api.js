import client from './client';

export const getVehicleTypes = () =>
  client.get('/vehicles/vehicle-types').then((r) => r.data);

export const getBrands = async (vehicleType) => {
  const res = await client.get(
    `/vehicles/brands?vehicle_type=${encodeURIComponent(vehicleType)}`
  )
  return res.data
}

export const getModels = async (brandName, vehicleType) => {
  const params = new URLSearchParams()
  params.append('vehicle_brand', brandName)
  if (vehicleType) params.append('vehicle_type', vehicleType)
  const res = await client.get(`/vehicles/models?${params.toString()}`)
  return res.data
}

export const getCategories = () =>
  client.get('/vehicles/categories').then((r) => r.data);
