
import sequelize from '../src/config/database';
import Employee from '../src/modules/hr/models/Employee';

async function checkCount() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const total = await Employee.count();
        console.log(`Total Employees (Raw Count): ${total}`);

        const active = await Employee.count({ where: { is_draft: false } });
        console.log(`Total Active Employees (is_draft=false): ${active}`);

        const drafts = await Employee.count({ where: { is_draft: true } });
        console.log(`Total Draft Employees: ${drafts}`);

        const first = await Employee.findOne();
        console.log('Sample Employee:', JSON.stringify(first, null, 2));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkCount();
