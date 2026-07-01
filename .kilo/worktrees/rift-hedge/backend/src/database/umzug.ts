import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/database';

export const migrator = new Umzug({
    migrations: {
        glob: ['migrations/*.ts', { cwd: __dirname }],
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

export type Migration = typeof migrator._types.migration;
