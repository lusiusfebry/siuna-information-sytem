const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env.test') });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'bebang_test',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '123456789',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        dialect: 'postgres',
        logging: true
    }
);

// Define models minimally
const Role = sequelize.define('Role', {
    name: { type: DataTypes.STRING, unique: true },
    display_name: { type: DataTypes.STRING },
    is_system_role: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'roles', underscored: true });

const User = sequelize.define('User', {
    nama: { type: DataTypes.STRING },
    nik: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    role_id: { type: DataTypes.INTEGER }
}, { tableName: 'users', underscored: true });

User.belongsTo(Role, { foreignKey: 'role_id', as: 'roleDetails' });

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected to', process.env.DB_NAME);

        const [role] = await Role.findOrCreate({
            where: { name: 'superadmin' },
            defaults: {
                name: 'superadmin',
                display_name: 'Superadmin',
                is_system_role: true
            }
        });
        console.log('Role found/created:', role.id);

        await User.destroy({ where: { nik: '888888' } });
        const user = await User.create({
            nama: 'Master Data Test User',
            nik: '888888',
            password: 'password123',
            role_id: role.id
        });
        console.log('User created:', user.id);

        const userWithRole = await User.findByPk(user.id, {
            include: [{ model: Role, as: 'roleDetails' }]
        });
        console.log('User role details:', userWithRole.roleDetails.name);

    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.errors) console.error('VALIDATION ERRORS:', e.errors.map(ve => ve.message));
    } finally {
        await sequelize.close();
    }
}

check();
