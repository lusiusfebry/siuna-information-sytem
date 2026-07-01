# API Reference - Sistem Informasi SDM Bebang

Base URL: `http://localhost:3000/api` (Development)  
Production: `https://api.bebang.com/api`

Swagger UI: `/api-docs`

## Authentication

Semua endpoint (kecuali `/auth/login`) memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

### POST /auth/login
Login ke sistem.

**Request Body:**
```json
{
  "nik": "1234567890123456",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Superadmin",
    "permissions": ["EMPLOYEES:CREATE", "EMPLOYEES:READ", ...]
  }
}
```

**Response 401:**
```json
{
  "status": "error",
  "message": "NIK atau password salah"
}
```

### GET /auth/me
Mendapatkan data user yang sedang login.

**Response 200:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "Superadmin",
  "permissions": [...]
}
```

## Employees

### GET /hr/employees
Mendapatkan daftar karyawan dengan pagination, filter, dan search.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10, max: 100)
- `search` (string) - Cari di nama/NIK
- `department_id` (integer)
- `divisi_id` (integer)
- `status_karyawan_id` (integer)
- `sort` (string, default: `created_at`) - Field untuk sorting
- `order` (string, default: `DESC`) - ASC/DESC

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "nomor_induk_karyawan": "1234567890123456",
      "nama_lengkap": "John Doe",
      "foto_karyawan": "/uploads/photos/user1.jpg",
      "department": { "id": 1, "nama": "IT" },
      "divisi": { "id": 1, "nama": "Technology" },
      "posisi_jabatan": { "id": 1, "nama": "Software Engineer" },
      "status_karyawan": { "id": 1, "nama": "Aktif" },
      "tanggal_bergabung": "2024-01-15",
      "is_active": true
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 15
}
```

### POST /hr/employees
Membuat karyawan baru (Wizard Step 1-3 combined).

**Content-Type:** `multipart/form-data`

**Request Body:**
```
nama_lengkap: John Doe
nomor_induk_karyawan: 1234567890123456
foto_karyawan: [File]
tempat_lahir: Jakarta
tanggal_lahir: 1990-05-20
jenis_kelamin: L
department_id: 1
divisi_id: 1
posisi_jabatan_id: 1
atasan_id: 5
tanggal_bergabung: 2024-01-15
status_karyawan_id: 1
jenis_hubungan_kerja_id: 2
...
data_anak: [{"nama": "Child 1", "nik": "...", "tanggal_lahir": "2015-01-01"}]
```

**Response 201:**
```json
{
  "id": 100,
  "nama_lengkap": "John Doe",
  "nomor_induk_karyawan": "1234567890123456",
  ...
}
```

**Response 400 (Validation Error):**
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": [
    "NIK sudah digunakan",
    "Atasan harus karyawan aktif dengan posisi manajemen"
  ]
}
```

### GET /hr/employees/:id
Detail lengkap karyawan.

**Response 200:**
```json
{
  "id": 1,
  "nomor_induk_karyawan": "...",
  "nama_lengkap": "...",
  "personal_info": {
    "tempat_lahir": "Jakarta",
    ...
  },
  "hr_info": {
    "jenis_hubungan_kerja": { "nama": "PKWTT" },
    ...
  },
  "family_info": {
    "nama_pasangan": "Jane Doe",
    "data_anak": [...]
  },
  "documents": [
    {
      "id": 1,
      "document_type": "KTP",
      "file_name": "ktp.pdf",
      "file_path": "/uploads/documents/...",
      "uploaded_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### PUT /hr/employees/:id
Update data karyawan.

**Request:** Sama seperti POST.

**Response 200:** Data karyawan yang sudah diupdate.

### DELETE /hr/employees/:id
Soft delete karyawan (set `is_active = false`).

**Response 200:**
```json
{
  "message": "Karyawan berhasil dihapus"
}
```

### GET /hr/employees/:id/qrcode
Generate QR Code karyawan.

**Response 200:** PNG image (binary)

### GET /hr/employees/:id/export/pdf
Export profil karyawan ke PDF.

**Response 200:** PDF file (binary)

## Master Data

Generic CRUD untuk master data (Divisi, Department, PosisiJabatan, dll).

### GET /hr/master/:model
List semua data master.

**Model**: `divisi`, `department`, `posisi-jabatan`, `status-karyawan`, `jenis-hubungan-kerja`, `golongan`, `sub-golongan`, `kategori-pangkat`, `lokasi-kerja`, `tag`

**Response 200:**
```json
{
  "data": [
    { "id": 1, "nama": "IT", "kode": "IT01" }
  ]
}
```

### POST /hr/master/:model
Buat data master baru.

**Request Body:**
```json
{
  "nama": "New Department",
  "kode": "DEPT01",
  "divisi_id": 1  // Jika required (Department, PosisiJabatan)
}
```

### PUT /hr/master/:model/:id
Update data master.

### DELETE /hr/master/:model/:id
Hapus data master (hard delete jika tidak ada relasi).

### GET /hr/master/cascade/departments-by-divisi/:divisiId
Dapatkan departments berdasarkan divisi (untuk cascade dropdown).

### GET /hr/master/cascade/posisi-by-department/:departmentId
Dapatkan posisi jabatan berdasarkan department.

### GET /hr/master/cascade/managers
Dapatkan karyawan yang bisa jadi atasan (is_management = true).

### GET /hr/master/active-employees
Dapatkan semua karyawan aktif (untuk dropdown atasan, dll).

## Import/Export

### POST /hr/import/employees/preview
Upload Excel untuk preview sebelum import.

**Content-Type:** `multipart/form-data`

**Request:**
```
file: [Excel File]
```

**Response 200:**
```json
{
  "preview": [
    {
      "row": 2,
      "data": { "nama_lengkap": "John", "nik": "..." },
      "isValid": true,
      "errors": []
    },
    {
      "row": 3,
      "data": { ... },
      "isValid": false,
      "errors": ["NIK sudah digunakan"]
    }
  ],
  "summary": {
    "total": 100,
    "valid": 98,
    "invalid": 2
  }
}
```

### POST /hr/import/employees
Import karyawan dari Excel (after preview).

**Request:** Sama seperti preview.

**Response 200:**
```json
{
  "success": 98,
  "failed": 2,
  "errors": [
    { "row": 3, "error": "NIK sudah digunakan" }
  ]
}
```

### POST /hr/import/master-data/:type
Import master data dari Excel.

**Type**: `divisi`, `department`, `posisi-jabatan`

### GET /hr/employees/export/excel
Export semua karyawan ke Excel.

**Query Parameters:**
- Filter sama seperti GET /hr/employees

**Response 200:** Excel file (binary)

## Documents

### GET /hr/employees/:employeeId/documents
List dokumen karyawan.

### POST /hr/employees/:employeeId/documents
Upload dokumen baru.

**Request:**
```
document_type: KTP
file: [File]
```

### DELETE /hr/documents/:documentId
Hapus dokumen.

## Audit Logs

### GET /hr/audit-logs
Mendapatkan audit logs dengan filter.

**Query Parameters:**
- `page`, `limit`
- `entity_type` (Employee, Department, dll)
- `action` (CREATE, UPDATE, DELETE)
- `user_id`
- `start_date`, `end_date`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "user": { "username": "admin" },
      "action": "UPDATE",
      "entity_type": "Employee",
      "entity_id": 5,
      "changes": {
        "before": { "nama_lengkap": "Old Name" },
        "after": { "nama_lengkap": "New Name" }
      },
      "timestamp": "2024-01-31T10:00:00Z"
    }
  ],
  "total": 500
}
```

### GET /hr/audit-logs/stats
Statistik audit log.

### GET /hr/entities/:type/:id/history
Riwayat perubahan entity tertentu.

## User & Role Management (RBAC)

### GET /auth/roles
List semua roles.

### POST /auth/roles
Buat role baru.

**Request:**
```json
{
  "name": "HR Staff",
  "description": "Staff HR dengan akses terbatas",
  "permissions": [
    { "resource": "EMPLOYEES", "action": "READ" },
    { "resource": "EMPLOYEES", "action": "CREATE" }
  ]
}
```

### GET /auth/users
List users.

### PUT /auth/users/:id
Update user role.

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": ["Field 'nama_lengkap' is required"]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Token tidak valid atau sudah kadaluarsa"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Anda tidak memiliki akses ke resource ini"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Data tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

---
*Untuk dokumentasi interaktif, akses `/api-docs` (Swagger UI)*
