import InvKategori from './Kategori';
import InvSubKategori from './SubKategori';
import InvBrand from './Brand';
import InvProduk from './Produk';
import InvUom from './Uom';
import InvGudang from './Gudang';
import InvStok from './Stok';
import InvTransaksi from './Transaksi';
import InvTransaksiDetail from './TransaksiDetail';
import InvSerialNumber from './SerialNumber';
import InvOpnameSession from './OpnameSession';
import InvOpnameDetail from './OpnameDetail';
import InvOpnamePetugas from './OpnamePetugas';
import InvOpnameSerial from './OpnameSerial';
import Employee from '../../hr/models/Employee';
import Department from '../../hr/models/Department';
import LokasiKerja from '../../hr/models/LokasiKerja';
import User from '../../auth/models/User';
import FacilityBuilding from '../../facility/models/Building';
import FacilityRoom from '../../facility/models/Room';

// Kategori -> SubKategori
InvKategori.hasMany(InvSubKategori, { foreignKey: 'kategori_id', as: 'sub_kategori' });
InvSubKategori.belongsTo(InvKategori, { foreignKey: 'kategori_id', as: 'kategori' });

// SubKategori -> Brand
InvSubKategori.hasMany(InvBrand, { foreignKey: 'sub_kategori_id', as: 'brands' });
InvBrand.belongsTo(InvSubKategori, { foreignKey: 'sub_kategori_id', as: 'sub_kategori' });

// Brand -> Produk
InvBrand.hasMany(InvProduk, { foreignKey: 'brand_id', as: 'produk' });
InvProduk.belongsTo(InvBrand, { foreignKey: 'brand_id', as: 'brand' });

// UOM -> Produk (default UOM)
InvUom.hasMany(InvProduk, { foreignKey: 'uom_id', as: 'produk' });
InvProduk.belongsTo(InvUom, { foreignKey: 'uom_id', as: 'uom' });

// Gudang -> Employee (penanggung jawab)
InvGudang.belongsTo(Employee, { foreignKey: 'penanggung_jawab_id', as: 'penanggung_jawab' });
Employee.hasMany(InvGudang, { foreignKey: 'penanggung_jawab_id', as: 'gudang_tanggung_jawab' });

// Gudang -> Department
InvGudang.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(InvGudang, { foreignKey: 'department_id', as: 'gudang' });

// Gudang -> LokasiKerja
InvGudang.belongsTo(LokasiKerja, { foreignKey: 'lokasi_kerja_id', as: 'lokasi_kerja' });

// Stok -> Produk, Gudang, Uom
InvStok.belongsTo(InvProduk, { foreignKey: 'produk_id', as: 'produk' });
InvStok.belongsTo(InvGudang, { foreignKey: 'gudang_id', as: 'gudang' });
InvStok.belongsTo(InvUom, { foreignKey: 'uom_id', as: 'uom' });
InvProduk.hasMany(InvStok, { foreignKey: 'produk_id', as: 'stok' });
InvGudang.hasMany(InvStok, { foreignKey: 'gudang_id', as: 'stok' });

// Transaksi -> Gudang, Karyawan, User, Facility
InvTransaksi.belongsTo(InvGudang, { foreignKey: 'gudang_id', as: 'gudang' });
InvTransaksi.belongsTo(InvGudang, { foreignKey: 'gudang_tujuan_id', as: 'gudang_tujuan' });
InvTransaksi.belongsTo(Employee, { foreignKey: 'karyawan_id', as: 'karyawan' });
InvTransaksi.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
InvTransaksi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
InvTransaksi.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
InvTransaksi.belongsTo(FacilityBuilding, { foreignKey: 'facility_building_id', as: 'facility_building' });
InvTransaksi.belongsTo(FacilityRoom, { foreignKey: 'facility_room_id', as: 'facility_room' });
InvTransaksi.belongsTo(User, { foreignKey: 'voided_by', as: 'voider' });
InvTransaksi.belongsTo(InvTransaksi, { foreignKey: 'amends_transaksi_id', as: 'transaksi_asli' });
InvTransaksi.hasOne(InvTransaksi, { foreignKey: 'amends_transaksi_id', as: 'transaksi_koreksi', constraints: false });
InvTransaksi.belongsTo(InvTransaksi, { foreignKey: 'amended_by_transaksi_id', as: 'transaksi_amender' });
InvTransaksi.hasMany(InvTransaksiDetail, { foreignKey: 'transaksi_id', as: 'details' });

// TransaksiDetail -> Transaksi, Produk, Uom
InvTransaksiDetail.belongsTo(InvTransaksi, { foreignKey: 'transaksi_id', as: 'transaksi' });
InvTransaksiDetail.belongsTo(InvProduk, { foreignKey: 'produk_id', as: 'produk' });
InvTransaksiDetail.belongsTo(InvUom, { foreignKey: 'uom_id', as: 'uom' });

// SerialNumber -> Produk, Gudang, Karyawan, Transaksi
InvSerialNumber.belongsTo(InvProduk, { foreignKey: 'produk_id', as: 'produk' });
InvSerialNumber.belongsTo(InvGudang, { foreignKey: 'gudang_id', as: 'gudang' });
InvSerialNumber.belongsTo(Employee, { foreignKey: 'karyawan_id', as: 'karyawan' });
InvSerialNumber.belongsTo(InvTransaksi, { foreignKey: 'transaksi_masuk_id', as: 'transaksi_masuk' });
InvSerialNumber.belongsTo(InvTransaksi, { foreignKey: 'transaksi_terakhir_id', as: 'transaksi_terakhir' });

// OpnameSession -> Gudang, Transaksi, User; OpnameDetail -> Session, Produk
InvOpnameSession.belongsTo(InvGudang, { foreignKey: 'gudang_id', as: 'gudang' });
InvOpnameSession.belongsTo(InvTransaksi, { foreignKey: 'transaksi_id', as: 'transaksi' });
InvOpnameSession.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
InvOpnameSession.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
InvOpnameSession.hasMany(InvOpnameDetail, { foreignKey: 'opname_session_id', as: 'detail' });
InvOpnameDetail.belongsTo(InvOpnameSession, { foreignKey: 'opname_session_id', as: 'session' });
InvOpnameDetail.belongsTo(InvProduk, { foreignKey: 'produk_id', as: 'produk' });

// OpnamePetugas: karyawan yang melakukan opname (many-to-many via join table)
InvOpnameSession.hasMany(InvOpnamePetugas, { foreignKey: 'opname_session_id', as: 'petugas' });
InvOpnamePetugas.belongsTo(InvOpnameSession, { foreignKey: 'opname_session_id', as: 'session' });
InvOpnamePetugas.belongsTo(Employee, { foreignKey: 'karyawan_id', as: 'karyawan' });

// OpnameSerial: snapshot per unit ber-serial/tag di gudang saat sesi dimulai
InvOpnameDetail.hasMany(InvOpnameSerial, { foreignKey: 'opname_detail_id', as: 'serials' });
InvOpnameSerial.belongsTo(InvOpnameDetail, { foreignKey: 'opname_detail_id', as: 'detail' });
InvOpnameSerial.belongsTo(InvSerialNumber, { foreignKey: 'serial_number_id', as: 'serial' });
