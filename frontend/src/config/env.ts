// Configuração de ambiente
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql',
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
