import { Sequelize } from 'sequelize';
import { env } from './env';

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: process.env.DEBUG_SQL === 'true'
        ? console.log
        : (env.nodeEnv === 'development'
            ? (sql: string, timing?: number) => {
                if (timing && timing > 1000) {
                    console.warn(`⚠️ Slow query (${timing}ms):`, sql);
                }
            }
            : false),
    benchmark: true,
    pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
        evict: 1000,
    },
});

export default sequelize;
