
// const redis = new Redis({
//     host: env.redis.host,
//     port: env.redis.port,
//     password: env.redis.password,
//     db: env.redis.db,
//     keyPrefix: env.redis.keyPrefix,
//     retryStrategy: (times: number) => {
//         const delay = Math.min(times * 50, 2000);
//         return delay;
//     },
//     maxRetriesPerRequest: 3,
// });

const redis = {
    get: async () => null,
    set: async () => { },
    setex: async () => { },
    del: async () => { },
    keys: async () => [],
    on: () => { },
} as any;

redis.on('connect', () => {
    console.log('✅ Redis connected');
});

redis.on('error', (err: any) => {
    console.error('❌ Redis error:', err);
});

export default redis;
