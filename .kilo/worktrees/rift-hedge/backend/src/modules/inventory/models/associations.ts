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
import Employee from '../../hr/models/Employee';
import Department from '../../hr/models/Department';
import LokasiKerja from '../../hr/models/LokasiKerja';
import User from '../../auth/models/User';

// Kategori -> SubKategori
InvKategori.hasMany(InvSubKategori, { foreignKey: 'kategori_id', as: 'sub_kategori' });
InvSubKategori.belongsTo(InvKategori, { foreignKey: 'kategori_id', as: 'kategori' });

// SubKategori -> Brand
InvSubKategori.hasMany(InvBrand, { foreignKey: 'sub_kategori_id', as: 'brands' });
InvBrand.belongsTo(InvSubKategori, { foreignKey: 'sub_kategori_id', as: 'sub_kategori' });

// Brand -> Produk
InvBrand.hasMany(InvProduk, { foreignKey: 'brand_id', as: 'produk' });
InvProduk.belongsTo(InvBrand, { foreignKey: 'brand_id', as: 'brand' });

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

// Transaksi -> Gudang, Karyawan, User
InvTransaksi.belongsTo(InvGudang, { foreignKey: 'gudang_id', as: 'gudang' });
InvTransaksi.belongsTo(InvGudang, { foreignKey: 'gudang_tujuan_id', as: 'gudang_tujuan' });
InvTransaksi.belongsTo(Employee, { foreignKey: 'karyawan_id', as: 'karyawan' });
InvTransaksi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
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
