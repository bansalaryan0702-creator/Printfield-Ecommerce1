export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  
  // Clone the response to safely peek at the content type or text
  // However, cloning and reading text is async, but we have to return a Response.
  // Instead, we intercept json/text, and we can't easily change the synchronous `ok` property
  // without reading the body first.
  
  // Actually, wait: we can read the body FIRST and then return a constructed response!
  
  const text = await response.text();
  const isHtml = text.trim().startsWith('<');
  const isOk = response.ok && !isHtml;

  return {
    get ok() { return isOk; },
    get status() { return isHtml && response.status === 200 ? 503 : response.status; },
    get statusText() { return isHtml && response.status === 200 ? 'Service Unavailable' : response.statusText; },
    get headers() { return response.headers; },
    get url() { return response.url; },
    get redirected() { return response.redirected; },
    get type() { return response.type; },
    get body() { return null; }, // Not supported in this mock
    get bodyUsed() { return false; },

    json: async () => {
      if (isHtml) {
        return { error: 'Service temporarily unavailable. Please try again later.' };
      }
      try {
        return text ? JSON.parse(text) : {};
      } catch (err) {
        return { error: 'Invalid JSON response from server.' };
      }
    },
    text: async () => text,
    blob: async () => new Blob([text]),
    clone: function() { return this; },
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
    formData: async () => new FormData(),
  } as unknown as Response;
}
