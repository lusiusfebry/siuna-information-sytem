import ExportService from '../export.service';
import Employee from '../../models/Employee';
import puppeteer from 'puppeteer';
import employeeService from '../employee.service';

// Mock dependencies
jest.mock('exceljs', () => {
    return {
        Workbook: jest.fn().mockImplementation(() => ({
            addWorksheet: jest.fn().mockReturnValue({
                columns: [],
                getRow: jest.fn().mockReturnValue({ font: {}, fill: {} }),
                addRow: jest.fn()
            }),
            xlsx: {
                writeBuffer: jest.fn().mockResolvedValue(Buffer.from('exported-excel'))
            }
        }))
    };
});

jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn(),
            pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-content'))
        }),
        close: jest.fn()
    })
}));

// The service imports models from their individual files (../models/Employee),
// NOT the barrel (../models), so mock the concrete modules it actually loads.
jest.mock('../../models/Employee', () => ({
    __esModule: true,
    default: { findAll: jest.fn(), findByPk: jest.fn() },
}));
jest.mock('../../models/EmployeePersonalInfo', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/EmployeeHRInfo', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/EmployeeFamilyInfo', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Divisi', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Department', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/PosisiJabatan', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/StatusKaryawan', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/LokasiKerja', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Tag', () => ({ __esModule: true, default: {} }));

jest.mock('../employee.service', () => ({
    getEmployeeById: jest.fn()
}));

describe('ExportService', () => {
    describe('exportEmployeesToExcel', () => {
        it('should generate excel buffer', async () => {
            const mockEmployees = [
                {
                    nomor_induk_karyawan: '123',
                    nama_lengkap: 'John Doe',
                    personal_info: {},
                    hr_info: {},
                    family_info: {}
                }
            ];
            (Employee.findAll as jest.Mock).mockResolvedValue(mockEmployees);

            const buffer = await ExportService.exportEmployeesToExcel({});
            expect(buffer).toBeInstanceOf(Buffer);
            expect(Employee.findAll).toHaveBeenCalled();
        });
    });

    describe('exportEmployeeProfileToPDF', () => {
        it('should generate PDF buffer', async () => {
            const mockEmployee = {
                id: 1,
                nama_lengkap: 'John Doe',
                nomor_induk_karyawan: '123',
                personal_info: { tanggal_lahir: '1990-01-01' },
                hr_info: {},
                family_info: {}
            };
            // Mock getEmployeeById from service import
            // Note: circular dependency mocking might be tricky if not careful, 
            // but here we mock the whole module in jest.mock above.
            (employeeService.getEmployeeById as jest.Mock).mockResolvedValue(mockEmployee);

            const buffer = await ExportService.exportEmployeeProfileToPDF(1);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(puppeteer.launch).toHaveBeenCalled();
        });
    });
});
