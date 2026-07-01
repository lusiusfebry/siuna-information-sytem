export const getOptimizedImageUrl = (url: string, _width: number = 100): string => {
    if (!url) return '/default-avatar.png';

    // For future: implement image resizing service
    // For now, return original with lazy loading
    return url;
};

export const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
    });
};
