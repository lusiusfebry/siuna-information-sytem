# Employee Database Schema

## Overview
This document describes the extended database schema for storing comprehensive employee information, including personal details, HR information, and family data.

## ER Diagram
```mermaid
erDiagram
    employees ||--o| employee_personal_info : has
    employees ||--o| employee_hr_info : has
    employees ||--o| employee_family_info : has
    employees }o--|| master_data_divisi : belongs_to
    employees }o--|| master_data_department : belongs_to
    employees }o--|| master_data_posisi_jabatan : belongs_to
    employees }o--|| master_data_status_karyawan : belongs_to
    employees }o--|| master_data_lokasi_kerja : belongs_to
    employees }o--|| master_data_tag : belongs_to
    employees }o--o| employees : manager
    employees }o--o| employees : atasan_langsung
    
    employee_hr_info }o--|| master_data_jenis_hubungan_kerja : belongs_to
    employee_hr_info }o--|| master_data_kategori_pangkat : belongs_to
    employee_hr_info }o--|| master_data_golongan : belongs_to
    employee_hr_info }o--|| master_data_sub_golongan : belongs_to
    employee_hr_info }o--|| master_data_lokasi_kerja : belongs_to
    
    employees {
        int id PK
        text foto_karyawan
        string nama_lengkap
        string nomor_induk_karyawan UK
        int divisi_id FK
        int department_id FK
        int manager_id FK
        int atasan_langsung_id FK
        int posisi_jabatan_id FK
        string email_perusahaan
        string nomor_handphone
        int status_karyawan_id FK
        int lokasi_kerja_id FK
        int tag_id FK
    }
    
    employee_personal_info {
        int id PK
        int employee_id FK
        enum jenis_kelamin
        string tempat_lahir
        date tanggal_lahir
        string email_pribadi
        string agama
        enum golongan_darah
        string nomor_ktp
        string nomor_npwp
        string status_pernikahan
        string nama_pasangan
        int jumlah_anak
        string nomor_rekening
        string nama_bank
    }
    
    employee_hr_info {
        int id PK
        int employee_id FK
        int jenis_hubungan_kerja_id FK
        date tanggal_masuk
        date tanggal_permanent
        date tanggal_kontrak
        date tanggal_akhir_kontrak
        int kategori_pangkat_id FK
        int golongan_pangkat_id FK
        string tingkat_pendidikan
        string nama_sekolah
    }
    
    employee_family_info {
        int id PK
        int employee_id FK
        jsonb data_anak
        jsonb data_saudara_kandung
        int anak_ke
        int jumlah_saudara_kandung
        string nama_ayah_mertua
        string nama_ibu_mertua
    }
```

## Tables

### 1. employees
Extends the basic employee table with references to master data and hierarchical relationships.

### 2. employee_personal_info
Stores personal biodata, identification numbers (KTP, NPWP, BPJS), addresses, and bank account information.

### 3. employee_hr_info
Stores employment details such as contract dates, educational background, rank/golongan, and emergency contacts.

### 4. employee_family_info
Stores family background including spouse, parents-in-law, and repeatable data for children and siblings using JSONB.

## JSONB Structures

### Data Anak
Stored in `employee_family_info.data_anak` as an array of objects:
```json
[
  {
    "nama": "String",
    "jenis_kelamin": "Laki-laki|Perempuan",
    "tanggal_lahir": "YYYY-MM-DD",
    "keterangan": "String"
  }
]
```

### Data Saudara Kandung
Stored in `employee_family_info.data_saudara_kandung` as an array of objects (max 5):
```json
[
  {
    "nama": "String",
    "jenis_kelamin": "Laki-laki|Perempuan",
    "tanggal_lahir": "YYYY-MM-DD",
    "pendidikan_terakhir": "String",
    "pekerjaan": "String",
    "keterangan": "String"
  }
]
```
