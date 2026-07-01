import { Router } from 'express';
import { validateInventoryMasterData } from '../../../shared/middleware/validateInventoryMasterData';
import { validateInventoryStok } from '../../../shared/middleware/validateInventoryStok';
import masterDataController from '../controllers/master-data.controller';
import stokController from '../controllers/stok.controller';
import dashboardController from '../controllers/dashboard.controller';
import exportController from '../controllers/export.controller';
import importController from '../controllers/import.controller';
import employeeAssetController from '../controllers/employee-asset.controller';
import labelController from '../controllers/label.controller';
import { checkPermission } from '../../../shared/middleware/permission.middleware';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { RESOURCES, ACTIONS } from '../../../shared/constants/permissions';
import { cacheMiddleware } from '../../../shared/middleware/cache.middleware';
import { auditLogger } from '../../../shared/middleware/auditLog.middleware';
import { uploadProductPhoto, uploadTransaksiDocuments, uploadExcelFile } from '../../../shared/middleware/upload.middleware';

const router = Router();

router.use(authenticate);

const dynamicAuditLogger = (req: any, res: any, next: any) => {
    return auditLogger(`inv_${req.params.model}`)(req, res, next);
};

// === Master Data Routes ===

router.get(
    '/master/:model',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.READ),
    cacheMiddleware(3600),
    (req, res, next) => masterDataController.getAll(req, res, next)
);

router.get(
    '/master/:model/:id',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => masterDataController.getOne(req, res, next)
);

router.post(
    '/master/:model',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.CREATE),
    validateInventoryMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.create(req, res, next)
);

router.put(
    '/master/:model/:id',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.UPDATE),
    validateInventoryMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.update(req, res, next)
);

router.delete(
    '/master/:model/:id',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.delete(req, res, next)
);

router.post(
    '/master/:model/:id/restore',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.restore(req, res, next)
);

router.put(
    '/master/produk/:id/photo',
    checkPermission(RESOURCES.INVENTORY_MASTER_DATA, ACTIONS.UPDATE),
    uploadProductPhoto,
    (req, res, next) => masterDataController.uploadPhoto(req, res, next)
);

// === Stok Routes ===

router.get(
    '/stok',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => stokController.getStok(req, res, next)
);

router.get(
    '/serial-numbers',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => stokController.getSerialNumbers(req, res, next)
);

router.post(
    '/transaksi',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE),
    validateInventoryStok,
    auditLogger('inv_transaksi'),
    (req, res, next) => stokController.createTransaksi(req, res, next)
);

router.get(
    '/transaksi',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => stokController.getTransaksiList(req, res, next)
);

router.get(
    '/transaksi/:id',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => stokController.getTransaksiDetail(req, res, next)
);

router.get(
    '/kartu-stok',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => stokController.getKartuStok(req, res, next)
);

router.post(
    '/transaksi/:id/dokumen',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.UPDATE),
    uploadTransaksiDocuments,
    (req, res, next) => stokController.uploadDokumen(req, res, next)
);

// === Dashboard Routes ===

router.get(
    '/dashboard/stats',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getStats(req, res, next)
);

router.get(
    '/dashboard/stock-by-warehouse',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getStockByWarehouse(req, res, next)
);

router.get(
    '/dashboard/category-breakdown',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getCategoryBreakdown(req, res, next)
);

router.get(
    '/dashboard/recent-transactions',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getRecentTransactions(req, res, next)
);

router.get(
    '/dashboard/low-stock',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getLowStockItems(req, res, next)
);

router.get(
    '/dashboard/item-velocity',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => dashboardController.getItemVelocity(req, res, next)
);

// === Import Routes ===

router.post(
    '/import/preview',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE),
    uploadExcelFile.single('file'),
    (req, res, next) => importController.uploadAndPreview(req, res, next)
);

router.post(
    '/import/produk',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE),
    (req, res, next) => importController.importProduk(req, res, next)
);

router.post(
    '/import/stok-masuk',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.CREATE),
    (req, res, next) => importController.importStokMasuk(req, res, next)
);

router.post(
    '/import/error-report',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => importController.downloadErrorReport(req, res, next)
);

// === Export Routes ===

router.get(
    '/export/stok/excel',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => exportController.exportStokExcel(req, res, next)
);

router.get(
    '/export/stok/pdf',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => exportController.exportStokPDF(req, res, next)
);

// === Employee Asset Routes ===

router.get(
    '/employee/:employeeId/assets',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.getAssets(req, res, next)
);

router.get(
    '/employee/:employeeId/asset-history',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.getHistory(req, res, next)
);

router.get(
    '/employee/:employeeId/berita-acara',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.downloadBeritaAcara(req, res, next)
);

router.get(
    '/employee/:employeeId/berita-acara/:transaksiId',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => employeeAssetController.downloadBeritaAcara(req, res, next)
);

// === Label & QR Code Routes ===

router.get(
    '/label/produk/:id/qr',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => labelController.getProductQR(req, res, next)
);

router.get(
    '/label/serial-number/:id/qr',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => labelController.getSerialNumberQR(req, res, next)
);

router.get(
    '/label/asset-tag/:id/qr',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => labelController.getAssetTagQR(req, res, next)
);

router.post(
    '/label/print',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => labelController.printLabels(req, res, next)
);

router.get(
    '/label/lookup',
    checkPermission(RESOURCES.INVENTORY_STOCK, ACTIONS.READ),
    (req, res, next) => labelController.lookupQR(req, res, next)
);

export default router;
