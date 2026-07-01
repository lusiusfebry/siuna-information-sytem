import { Router } from 'express';
import { validateFacilityMasterData } from '../../../shared/middleware/validateFacilityMasterData';
import { validateFacilityWorkOrder } from '../../../shared/middleware/validateFacilityWorkOrder';
import masterDataController from '../controllers/master-data.controller';
import workOrderController from '../controllers/work-order.controller';
import occupantController from '../controllers/occupant.controller';
import assetController from '../controllers/asset.controller';
import dashboardController from '../controllers/dashboard.controller';
import { checkPermission } from '../../../shared/middleware/permission.middleware';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { RESOURCES, ACTIONS } from '../../../shared/constants/permissions';
import { cacheMiddleware } from '../../../shared/middleware/cache.middleware';
import { auditLogger } from '../../../shared/middleware/auditLog.middleware';

const router = Router();

router.use(authenticate);

const dynamicAuditLogger = (req: any, res: any, next: any) => {
    return auditLogger(`fac_${req.params.model}`)(req, res, next);
};

// === Dashboard ===

router.get(
    '/dashboard/summary',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => dashboardController.getSummary(req, res, next)
);

// === Master Data Routes ===

router.get(
    '/master/:model',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    cacheMiddleware(3600),
    (req, res, next) => masterDataController.getAll(req, res, next)
);

router.get(
    '/master/:model/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => masterDataController.getOne(req, res, next)
);

router.post(
    '/master/:model',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.CREATE),
    validateFacilityMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.create(req, res, next)
);

router.put(
    '/master/:model/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.UPDATE),
    validateFacilityMasterData,
    dynamicAuditLogger,
    (req, res, next) => masterDataController.update(req, res, next)
);

router.delete(
    '/master/:model/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.delete(req, res, next)
);

router.post(
    '/master/:model/:id/restore',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.DELETE),
    dynamicAuditLogger,
    (req, res, next) => masterDataController.restore(req, res, next)
);

// === Work Order Routes ===

router.get(
    '/work-orders',
    checkPermission(RESOURCES.FACILITY_WORK_ORDER, ACTIONS.READ),
    (req, res, next) => workOrderController.getAll(req, res, next)
);

router.get(
    '/work-orders/:id',
    checkPermission(RESOURCES.FACILITY_WORK_ORDER, ACTIONS.READ),
    (req, res, next) => workOrderController.getOne(req, res, next)
);

router.post(
    '/work-orders',
    checkPermission(RESOURCES.FACILITY_WORK_ORDER, ACTIONS.CREATE),
    validateFacilityWorkOrder,
    auditLogger('fac_work_order'),
    (req, res, next) => workOrderController.create(req, res, next)
);

router.put(
    '/work-orders/:id',
    checkPermission(RESOURCES.FACILITY_WORK_ORDER, ACTIONS.UPDATE),
    validateFacilityWorkOrder,
    auditLogger('fac_work_order'),
    (req, res, next) => workOrderController.update(req, res, next)
);

// === Occupant Routes ===

router.get(
    '/occupants',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => occupantController.getAll(req, res, next)
);

router.get(
    '/occupants/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => occupantController.getOne(req, res, next)
);

router.post(
    '/occupants',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.CREATE),
    auditLogger('fac_occupant'),
    (req, res, next) => occupantController.create(req, res, next)
);

router.put(
    '/occupants/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.UPDATE),
    auditLogger('fac_occupant'),
    (req, res, next) => occupantController.update(req, res, next)
);

router.put(
    '/occupants/:id/checkout',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.UPDATE),
    auditLogger('fac_occupant'),
    (req, res, next) => occupantController.checkout(req, res, next)
);

// === Asset Routes ===

router.get(
    '/assets',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => assetController.getAll(req, res, next)
);

router.get(
    '/assets/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.READ),
    (req, res, next) => assetController.getOne(req, res, next)
);

router.post(
    '/assets',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.CREATE),
    auditLogger('fac_asset'),
    (req, res, next) => assetController.create(req, res, next)
);

router.put(
    '/assets/:id',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.UPDATE),
    auditLogger('fac_asset'),
    (req, res, next) => assetController.update(req, res, next)
);

router.put(
    '/assets/:id/withdraw',
    checkPermission(RESOURCES.FACILITY_MASTER_DATA, ACTIONS.UPDATE),
    auditLogger('fac_asset'),
    (req, res, next) => assetController.withdraw(req, res, next)
);

export default router;
