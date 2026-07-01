export interface ImportOptions {
    skipValidation?: boolean;
    updateExisting?: boolean;
}

export interface ImportError {
    row: number;
    field?: string;
    message: string;
    data?: any;
}

export interface ImportResult {
    success: number;
    failed: number;
    total: number;
    errors: ImportError[];
    duration?: number;
}

export interface ExcelMapping {
    masterData: Record<string, string>;
    employeeProfile: Record<string, string>;
}

export interface PreviewData {
    headers: string[];
    rows: any[];
    totalRows: number;
    mapping?: ExcelMapping;
}
