const config = {
  env:          import.meta.env.VITE_ENV,
  apiUrl:       import.meta.env.VITE_API_URL,
  isLocal:      import.meta.env.VITE_ENV === 'e1',
  isProduction: import.meta.env.VITE_ENV === 'e3',
};

export default config;
