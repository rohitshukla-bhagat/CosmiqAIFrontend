const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  body?: any;
}

let refreshPromise: Promise<string> | null = null;

async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${BASE_URL}${path}`;
  
  const headers = new Headers(options.headers || {});
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response = await fetch(url, fetchOptions);
  
  // If unauthorized (401), try refreshing token, unless we are already on auth paths
  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    if (!refreshPromise) {
      refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }).then(async (refreshResult) => {
        if (refreshResult.ok) {
          const refreshData = await refreshResult.json();
          if (refreshData.accessToken) {
            localStorage.setItem('accessToken', refreshData.accessToken);
            localStorage.setItem('user', JSON.stringify(refreshData.user));
            return refreshData.accessToken;
          }
        }
        // Refresh token invalid/expired, clear auth state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth_session_expired'));
        throw new Error('Session expired');
      }).finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newAccessToken = await refreshPromise;
      // Retry original request with new access token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      fetchOptions.headers = headers;
      response = await fetch(url, fetchOptions);
    } catch (refreshErr) {
      console.error('Failed to auto-refresh token:', refreshErr);
    }
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'POST', body }),
  put: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PUT', body }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'DELETE' }),
};
