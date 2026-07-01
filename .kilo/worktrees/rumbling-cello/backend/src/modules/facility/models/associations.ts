import FacilityBuilding from './Building';
import FacilityRoomType from './RoomType';
import FacilityRoom from './Room';
import FacilityMaintenanceCategory from './MaintenanceCategory';
import FacilityOccupant from './Occupant';
import FacilityAsset from './Asset';
import FacilityWorkOrder from './WorkOrder';
import Employee from '../../hr/models/Employee';
import LokasiKerja from '../../hr/models/LokasiKerja';
import User from '../../auth/models/User';
import InvSerialNumber from '../../inventory/models/SerialNumber';

// Building -> LokasiKerja
FacilityBuilding.belongsTo(LokasiKerja, { foreignKey: 'lokasi_kerja_id', as: 'lokasi_kerja' });

// Building -> Employee (penanggung jawab)
FacilityBuilding.belongsTo(Employee, { foreignKey: 'penanggung_jawab_id', as: 'penanggung_jawab' });

// Building -> Rooms
FacilityBuilding.hasMany(FacilityRoom, { foreignKey: 'building_id', as: 'rooms' });
FacilityRoom.belongsTo(FacilityBuilding, { foreignKey: 'building_id', as: 'building' });

// Room -> RoomType
FacilityRoom.belongsTo(FacilityRoomType, { foreignKey: 'room_type_id', as: 'room_type' });
FacilityRoomType.hasMany(FacilityRoom, { foreignKey: 'room_type_id', as: 'rooms' });

// Room -> Occupants
FacilityRoom.hasMany(FacilityOccupant, { foreignKey: 'room_id', as: 'occupants' });
FacilityOccupant.belongsTo(FacilityRoom, { foreignKey: 'room_id', as: 'room' });

// Occupant -> Employee
FacilityOccupant.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// Occupant -> User (created_by)
FacilityOccupant.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Room -> Assets
FacilityRoom.hasMany(FacilityAsset, { foreignKey: 'room_id', as: 'assets' });
FacilityAsset.belongsTo(FacilityRoom, { foreignKey: 'room_id', as: 'room' });

// Asset -> InvSerialNumber
FacilityAsset.belongsTo(InvSerialNumber, { foreignKey: 'serial_number_id', as: 'serial_number' });

// Asset -> User (created_by)
FacilityAsset.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Room -> WorkOrders
FacilityRoom.hasMany(FacilityWorkOrder, { foreignKey: 'room_id', as: 'work_orders' });
FacilityWorkOrder.belongsTo(FacilityRoom, { foreignKey: 'room_id', as: 'room' });

// WorkOrder -> MaintenanceCategory
FacilityWorkOrder.belongsTo(FacilityMaintenanceCategory, { foreignKey: 'kategori_id', as: 'kategori' });

// WorkOrder -> Employee (reported_by, assigned_to)
FacilityWorkOrder.belongsTo(Employee, { foreignKey: 'reported_by', as: 'reporter' });
FacilityWorkOrder.belongsTo(Employee, { foreignKey: 'assigned_to', as: 'assignee' });

// WorkOrder -> User (created_by)
FacilityWorkOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

export {
    FacilityBuilding,
    FacilityRoomType,
    FacilityRoom,
    FacilityMaintenanceCategory,
    FacilityOccupant,
    FacilityAsset,
    FacilityWorkOrder,
};
