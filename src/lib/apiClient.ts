import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  validateStatus: () => true, // Don't throw on standard HTTP errors so we can handle them
});

// Request interceptor to attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token') || localStorage.getItem('admin_token');
  if (token && config.headers) {
    
    // sanitize token to ensure no invalid header chars
    let cleanToken = token.replace(/[^\x20-\x7E]/g, '');
    config.headers.Authorization = `Bearer ${cleanToken}`;

  }
  return config;
});

// Response interceptor to catch HTML responses
apiClient.interceptors.response.use((response) => {
  // If the server returns HTML instead of JSON (e.g. 502 Bad Gateway proxy error)
  if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
     // Suppress console.error so it doesn't trigger AI Studio's error metadata during server restarts
     return {
         ...response,
         data: { error: 'Service temporarily unavailable. Please try again.' },
         status: 503
     };
  }
  return response;
});

export default apiClient;
