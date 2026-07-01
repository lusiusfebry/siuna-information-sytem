import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/api/notification.service';

export const useNotifications = (page = 1) => {
    return useQuery({
        queryKey: ['notifications', page],
        queryFn: () => notificationService.getAll(page),
    });
};

export const useUnreadCount = () => {
    return useQuery({
        queryKey: ['notifications', 'unreadCount'],
        queryFn: () => notificationService.getUnreadCount(),
        refetchInterval: 30000,
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
