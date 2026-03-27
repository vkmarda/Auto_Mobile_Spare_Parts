import axios from 'axios';
import config from '../config/env';

const client = axios.create({
  baseURL: config.apiUrl,
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default client;
