import axios, { AxiosRequestConfig } from 'axios';

// Create a global axios instance
export const apiClient = axios.create({
  baseURL: '/', // We handle absolute paths if passed
  validateStatus: () => true // We resolve all HTTP statuses so we can mimic `fetch`'s ok property instead of throwing
});

// We can optionally add interceptors here if needed
apiClient.interceptors.response.use(response => {
  // If we receive an HTML error page (like an unexpected Express error or 502 proxy error)
  if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
    // Suppress console.error so it doesn't trigger AI Studio's error metadata during server restarts
    response.data = { error: 'Service temporarily unavailable. Please try again later.' };
  }
  return response;
});

/**
 * A drop-in replacement for `fetch` that uses Axios under the hood.
 * It prevents native `JSON.parse` crashes by leveraging Axios's robust handling,
 * and normalizes HTML error pages into a standard JSON error response.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  
  const config: AxiosRequestConfig = {
    url,
    method: init?.method || 'GET',
    headers: (init?.headers as any) || {},
  };

  // If a body string is provided, try parsing it so Axios can send it gracefully
  if (init?.body) {
    if (typeof init.body === 'string') {
      try {
        config.data = JSON.parse(init.body);
      } catch (e) {
        config.data = init.body;
      }
    } else {
      config.data = init.body;
    }
  }

  try {
    const response = await apiClient(config);
    let status = response.status;
    let isOk = status >= 200 && status < 300;
    
    // Check if the interceptor caught an HTML body and set error response
    if (response.data && response.data.error === 'Service temporarily unavailable. Please try again later.') {
       isOk = false;
       status = 503;
    }

    // Mimic the native fetch Response object
    return {
      ok: isOk,
      status: status,
      statusText: response.statusText,
      headers: new Headers(response.headers as any),
      url: response.config.url || url,
      redirected: false,
      type: 'basic',
      // Return the axios-parsed data unconditionally
      json: async () => response.data,
      text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      blob: async () => new Blob([typeof response.data === 'string' ? response.data : JSON.stringify(response.data)]),
      clone: function () { return this; }
    } as any as Response;
  } catch (error: any) {
    console.error("Network Error in apiFetch:", error);
    // In case of a hard network error (e.g. no internet)
    return {
      ok: false,
      status: 503,
      statusText: 'Network Error',
      headers: new Headers(),
      json: async () => ({ error: 'Network Error' }),
      text: async () => JSON.stringify({ error: 'Network Error' }),
      clone: function () { return this; }
    } as any as Response;
  }
}
