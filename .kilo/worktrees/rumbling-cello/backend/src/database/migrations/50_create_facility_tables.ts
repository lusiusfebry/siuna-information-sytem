import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // 1. facility_buildings
    await queryInterface.createTable('facility_buildings', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        tipe: {
            type: DataTypes.ENUM('Mess', 'Kantor', 'Workshop', 'Lainnya'),
            allowNull: false, defaultValue: 'Mess',
        },
        lokasi_kerja_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'lokasi_kerja', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        alamat: { type: DataTypes.TEXT, allowNull: true },
        penanggung_jawab_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        kapasitas_total: { type: DataTypes.INTEGER, allowNull: true },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex('facility_buildings', ['status']);
    await queryInterface.addIndex('facility_buildings', ['tipe']);
    await queryInterface.addIndex('facility_buildings', ['code']);

    // 2. facility_room_types
    await queryInterface.createTable('facility_room_types', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex('facility_room_types', ['status']);
    await queryInterface.addIndex('facility_room_types', ['code']);

    // 3. facility_rooms
    await queryInterface.createTable('facility_rooms', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        building_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_buildings', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        room_type_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'facility_room_types', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        lantai: { type: DataTypes.STRING(20), allowNull: true },
        kapasitas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Tersedia', 'Penuh', 'Maintenance', 'Tidak Aktif'), allowNull: false, defaultValue: 'Tersedia' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex('facility_rooms', ['building_id']);
    await queryInterface.addIndex('facility_rooms', ['room_type_id']);
    await queryInterface.addIndex('facility_rooms', ['status']);
    await queryInterface.addIndex('facility_rooms', ['code']);

    // 4. facility_maintenance_categories
    await queryInterface.createTable('facility_maintenance_categories', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex('facility_maintenance_categories', ['status']);
    await queryInterface.addIndex('facility_maintenance_categories', ['code']);

    // 5. facility_occupants
    await queryInterface.createTable('facility_occupants', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        tanggal_masuk: { type: DataTypes.DATEONLY, allowNull: false },
        tanggal_keluar: { type: DataTypes.DATEONLY, allowNull: true },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Aktif', 'Selesai'), allowNull: false, defaultValue: 'Aktif' },
        created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('facility_occupants', ['room_id']);
    await queryInterface.addIndex('facility_occupants', ['employee_id']);
    await queryInterface.addIndex('facility_occupants', ['status']);

    // 6. facility_assets
    await queryInterface.createTable('facility_assets', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        serial_number_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'inv_serial_number', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        tanggal_penempatan: { type: DataTypes.DATEONLY, allowNull: false },
        tanggal_penarikan: { type: DataTypes.DATEONLY, allowNull: true },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Aktif', 'Ditarik'), allowNull: false, defaultValue: 'Aktif' },
        created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('facility_assets', ['room_id']);
    await queryInterface.addIndex('facility_assets', ['serial_number_id']);
    await queryInterface.addIndex('facility_assets', ['status']);

    // 7. facility_work_orders
    await queryInterface.createTable('facility_work_orders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        kategori_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'facility_maintenance_categories', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        judul: { type: DataTypes.STRING(200), allowNull: false },
        deskripsi: { type: DataTypes.TEXT, allowNull: true },
        prioritas: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), allowNull: false, defaultValue: 'Medium' },
        status: { type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'), allowNull: false, defaultValue: 'Open' },
        reported_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        assigned_to: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        tanggal_lapor: { type: DataTypes.DATEONLY, allowNull: false },
        tanggal_selesai: { type: DataTypes.DATEONLY, allowNull: true },
        estimasi_biaya: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
        realisasi_biaya: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
        catatan_penyelesaian: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('facility_work_orders', ['room_id']);
    await queryInterface.addIndex('facility_work_orders', ['status']);
    await queryInterface.addIndex('facility_work_orders', ['prioritas']);
    await queryInterface.addIndex('facility_work_orders', ['code']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('facility_work_orders');
    await queryInterface.dropTable('facility_assets');
    await queryInterface.dropTable('facility_occupants');
    await queryInterface.dropTable('facility_maintenance_categories');
    await queryInterface.dropTable('facility_rooms');
    await queryInterface.dropTable('facility_room_types');
    await queryInterface.dropTable('facility_buildings');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_work_orders_prioritas"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_work_orders_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_assets_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_occupants_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_maintenance_categories_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_rooms_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_room_types_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_buildings_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_facility_buildings_tipe"');
};