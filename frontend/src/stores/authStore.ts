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
                set({ token, user, isAuthenticated: true });
                localStorage.setItem('token', token);
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                localStorage.removeItem('token');
                // Optional: call API logout
                // authService.logout().catch(console.error);
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
                const token = localStorage.getItem('token'); // or get().token if persisted
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false });
                    return;
                }

                try {
                    // Verify token with backend
                    const response = await authService.getCurrentUser();
                    set({ user: response.data.user, isAuthenticated: true, token }); // ensure token is in state
                } catch (error: unknown) {
                    // Only log out when the token is genuinely rejected (401/403).
                    // A network error / 5xx / timeout must NOT destroy a valid session,
                    // otherwise a transient blip bounces the user to /login.
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 401 || status === 403) {
                        get().logout();
                    } else {
                        console.error('Auth check failed (keeping session):', error);
                    }
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
