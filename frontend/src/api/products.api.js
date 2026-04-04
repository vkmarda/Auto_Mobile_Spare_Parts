import client from './client'

export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.vehicle_brand) params.append('vehicle_brand', filters.vehicle_brand)
  if (filters.vehicle_model) params.append('vehicle_model', filters.vehicle_model)
  if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type)
  if (filters.search) params.append('search', filters.search)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.offset) params.append('offset', filters.offset)

  const res = await client.get(`/products?${params.toString()}`)
  return res.data
}

export const getProductById = async (id) => {
  const res = await client.get(`/products/${id}`)
  return res.data
}

export const getVehicleBrands = async () => {
  const res = await client.get('/products/vehicle-brands')
  return res.data
}

export const createProduct = async (data) => {
  const res = await client.post('/products', data)
  return res.data
}

export const updateProduct = async (id, data) => {
  const res = await client.put(`/products/${id}`, data)
  return res.data
}
