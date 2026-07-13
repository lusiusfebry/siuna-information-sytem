import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    // Send/receive httpOnly auth cookies with every request.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Read a non-httpOnly cookie value by name (used for the CSRF double-submit token).
const readCookie = (name: string): string | undefined => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
};

// Legacy fallback: if a token still lives in localStorage (older sessions),
// attach it. New logins rely on the httpOnly cookie and won't set this.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Echo the CSRF cookie back as a header on state-changing requests
    // (double-submit-cookie pattern).
    const method = (config.method || 'get').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrf = readCookie('csrf_token');
        if (csrf) {
            config.headers['X-CSRF-Token'] = csrf;
        }
    }
    return config;
});

// On 401, try ONE silent token refresh (via the refresh-token cookie) and retry
// the original request. If refresh fails, clear any legacy token and redirect to
// login. A module-level flag + per-request marker prevent infinite loops.
let isRefreshing = false;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url: string = originalRequest?.url || '';

        // Never try to refresh the auth endpoints themselves.
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

        if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
                if (!isRefreshing) {
                    isRefreshing = true;
                    await api.post('/auth/refresh');
                    isRefreshing = false;
                }
                // Legacy header path: drop any stale localStorage token so the
                // retry uses the fresh cookie.
                localStorage.removeItem('token');
                return api(originalRequest);
            } catch (refreshErr) {
                isRefreshing = false;
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
