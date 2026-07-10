import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/auth';
import { authService } from '../services/api/auth.service';

interface AuthStore extends AuthState {
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            isLoadingPermissions: false,

            login: (token: string, user: User) => {
                // Auth now lives in an httpOnly cookie set by the server. We keep
                // the token in memory only (not localStorage) so it isn't exposed
                // to XSS; the cookie is what actually authenticates requests.
                set({ token, user, isAuthenticated: true });
                localStorage.removeItem('token');
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                localStorage.removeItem('token');
                // Clear the server-side auth cookies too.
                authService.logout().catch(() => { /* ignore */ });
            },

            setLoading: (isLoading: boolean) => set({ isLoading }),

            setUser: (user: User) => set({ user }),

            hasPermission: (resource: string, action: string) => {
                const { user } = get();
                if (!user || !user.roleDetails || !user.roleDetails.permissions) return false;

                // Superadmin bypass (optional, but good for safety)
                if (user.roleDetails.name === 'superadmin') return true;

                return user.roleDetails.permissions.some(
                    p => p.resource === resource && p.action === action
                );
            },

            checkAuth: async () => {
                // The httpOnly cookie is sent automatically; just ask the server
                // who we are. A 401 triggers the axios interceptor's silent
                // refresh+retry, so a merely-expired access token self-heals.
                try {
                    const response = await authService.getCurrentUser();
                    set({ user: response.data.user, isAuthenticated: true });
                } catch (error: unknown) {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 401 || status === 403) {
                        // Genuinely unauthenticated (refresh also failed).
                        set({ user: null, isAuthenticated: false });
                        localStorage.removeItem('token');
                    } else {
                        // Network blip / 5xx — keep any existing session.
                        console.error('Auth check failed (keeping session):', error);
                    }
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            // Persist only the user for UX; auth is proven by the cookie via
            // checkAuth on load (never persist the token).
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
