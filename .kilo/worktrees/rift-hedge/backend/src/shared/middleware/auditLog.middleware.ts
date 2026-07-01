import { Request, Response, NextFunction } from 'express';
import AuditLog, { AuditAction } from '../../modules/hr/models/AuditLog';
import { sanitizeValues, getEntityName, shouldAudit } from '../utils/auditHelper';

// Extend Request type to include potential user data from auth middleware
interface AuthenticatedRequest extends Request {
    user?: any;
}

// Import models for mapping
import {
    Employee,
    Divisi,
    Department,
    PosisiJabatan,
    KategoriPangkat,
    Golongan,
    SubGolongan,
    JenisHubunganKerja,
    Tag,
    LokasiKerja,
    StatusKaryawan
} from '../../modules/hr/models';

import {
    InvKategori, InvSubKategori, InvBrand, InvUom,
    InvProduk, InvGudang, InvTransaksi
} from '../../modules/inventory/models';

const MODEL_MAP: Record<string, any> = {
    'employees': Employee,
    'divisi': Divisi,
    'department': Department,
    'posisi-jabatan': PosisiJabatan,
    'kategori-pangkat': KategoriPangkat,
    'golongan': Golongan,
    'sub-golongan': SubGolongan,
    'jenis-hubungan-kerja': JenisHubunganKerja,
    'tag': Tag,
    'lokasi-kerja': LokasiKerja,
    'status-karyawan': StatusKaryawan,
    'inv_kategori': InvKategori,
    'inv_sub-kategori': InvSubKategori,
    'inv_brand': InvBrand,
    'inv_uom': InvUom,
    'inv_produk': InvProduk,
    'inv_gudang': InvGudang,
    'inv_transaksi': InvTransaksi,
};

export const auditLogger = (entityType: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Skip if not needing audit
        if (!shouldAudit(req)) {
            return next();
        }

        // Determine Action
        let action: AuditAction = 'VIEW';
        if (req.method === 'POST') action = 'CREATE';
        if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        if (req.method === 'DELETE') action = 'DELETE';

        // 1. Fetch Old Values for UPDATE/DELETE
        let oldValues: any = null;
        const id = req.params.id; // Assuming ID is in params for update/delete

        if ((action === 'UPDATE' || action === 'DELETE') && id) {
            try {
                // Resolve Model
                // entityType could be static like 'employees' or dynamic like 'divisi' (passed from params)
                // If it's master data route, entityType comes from req.params.model which is passed to this factory?
                // Actually the factory receives `entityType`. 
                // In my dynamic wrapper: `auditLogger(req.params.model)`. So entityType IS the model name.

                const ModelClass = MODEL_MAP[entityType] || MODEL_MAP[entityType.toLowerCase()];
                if (ModelClass) {
                    const record = await ModelClass.findByPk(id);
                    if (record) {
                        oldValues = record.toJSON();
                    }
                } else {
                    // Fallback or explicit check for 'employees' if entityType is 'employees'
                    if (entityType === 'employees') {
                        const record = await Employee.findByPk(id);
                        if (record) oldValues = record.toJSON();
                    }
                }
            } catch (err) {
                console.warn(`[AuditLog] Failed to fetch old values for ${entityType} ${id}`, err);
            }
        }

        // 2. Intercept Response to get New Values / Created ID
        let responseBody: any = null;
        const originalSend = res.send;

        res.send = function (body): Response {
            responseBody = body;
            return originalSend.call(this, body);
        };

        // 3. Log on Finish
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const user = req.user;
                    const inputs = sanitizeValues(req.body);
                    let finalEntityId = id ? parseInt(id) : null;
                    let newValues = null;

                    // Parse response body if needed
                    let parsedResponse: any = null;
                    try {
                        if (typeof responseBody === 'string') {
                            parsedResponse = JSON.parse(responseBody);
                        } else if (typeof responseBody === 'object') {
                            parsedResponse = responseBody;
                        }
                    } catch { /* ignore parse error */ }

                    // Strategies for New Values & ID
                    if (action === 'CREATE') {
                        // Usually controller returns { status: 'success', data: { id: 1, ... } }
                        if (parsedResponse && parsedResponse.data) {
                            if (parsedResponse.data.id) {
                                finalEntityId = parsedResponse.data.id;
                            }
                            // Store persisted data as newValues
                            newValues = sanitizeValues(parsedResponse.data);
                        } else {
                            // Fallback to request body if response parsing failed
                            newValues = inputs;
                        }
                    } else if (action === 'UPDATE') {
                        // For update, we want to see what changed. 
                        // If controller returns updated record, use it.
                        if (parsedResponse && parsedResponse.data) {
                            newValues = sanitizeValues(parsedResponse.data);
                        } else {
                            newValues = inputs;
                        }
                    }

                    // Construct log
                    await AuditLog.create({
                        user_id: user?.id,
                        user_nik: user?.nik,
                        user_name: user?.name,
                        action,
                        entity_type: entityType,
                        entity_id: finalEntityId,
                        entity_name: getEntityName(entityType, newValues || oldValues || inputs),
                        old_values: oldValues,
                        new_values: action !== 'DELETE' ? newValues : null,
                        ip_address: req.ip || (req.headers['x-forwarded-for'] as string),
                        user_agent: req.headers['user-agent'],
                        timestamp: new Date()
                    });
                } catch (error) {
                    console.error('Audit Logging Failed:', error);
                }
            }
        });

        next();
    };
};
