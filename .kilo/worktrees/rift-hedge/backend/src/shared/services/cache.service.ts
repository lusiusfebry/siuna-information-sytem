import redis from '../../config/redis';

class CacheService {
    async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl: number = 3600): Promise<void> {
        await redis.setex(key, ttl, JSON.stringify(value));
    }

    async del(key: string): Promise<void> {
        await redis.del(key);
    }

    async delPattern(pattern: string): Promise<void> {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }

    async remember<T>(
        key: string,
        ttl: number,
        callback: () => Promise<T>
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;

        const fresh = await callback();
        await this.set(key, fresh, ttl);
        return fresh;
    }
}

export default new CacheService();
