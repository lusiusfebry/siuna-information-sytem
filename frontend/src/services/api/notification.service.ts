import client from './client';

export interface NotificationItem {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    entity_type?: string;
    entity_id?: number;
    is_read: boolean;
    created_at: string;
}

const getAll = async (page = 1, limit = 20): Promise<{ status: string; data: NotificationItem[]; total: number; page: number; totalPages: number }> => {
    const response = await client.get('/notifications', { params: { page, limit } });
    return response.data;
};

const getUnreadCount = async (): Promise<{ status: string; data: { count: number } }> => {
    const response = await client.get('/notifications/unread-count');
    return response.data;
};

const markAsRead = async (id: number): Promise<{ status: string; data: NotificationItem }> => {
    const response = await client.put(`/notifications/${id}/read`);
    return response.data;
};

const markAllAsRead = async (): Promise<{ status: string; message: string }> => {
    const response = await client.put('/notifications/read-all');
    return response.data;
};

const notificationService = {
    getAll,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};

export default notificationService;
