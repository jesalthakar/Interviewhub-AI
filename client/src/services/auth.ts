import axios, { AxiosHeaders } from 'axios';

axios.defaults.withCredentials = true;

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAuthState = () => {
  accessToken = null;
};

export const signOut = async (): Promise<void> => {
  try {
    await axios.post('/api/auth/logout', {});
  } finally {
    clearAuthState();
    window.location.replace('/login');
  }
};

const isTokenNearExpiry = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = Number(payload.exp || 0) * 1000;
    const bufferMs = 5 * 60 * 1000;
    return Date.now() >= expiresAt - bufferMs;
  } catch {
    return true;
  }
};

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

axios.interceptors.request.use(async (config) => {
  if (!accessToken) {
    return config;
  }

  if (isTokenNearExpiry(accessToken)) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        setAccessToken(data.token);
      } catch (error) {
        clearAuthState();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
        pendingRequests.forEach((resolve) => resolve());
        pendingRequests = [];
      }
    }

    await new Promise<void>((resolve) => {
      pendingRequests.push(resolve);
    });
  }

  if (accessToken) {
    const headers = new AxiosHeaders(config.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    config.headers = headers;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        setAccessToken(data.token);

        const headers = new AxiosHeaders(originalRequest.headers || {});
        headers.set('Authorization', `Bearer ${data.token}`);
        originalRequest.headers = headers;

        return axios(originalRequest);
      } catch (refreshError) {
        clearAuthState();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
