
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

const PermissionDeniedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center space-y-8">
                <div>
                    <span className="material-symbols-outlined text-[64px] text-red-500">
                        block
                    </span>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Akses Ditolak
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
                    </p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                    >
                        Ke Dashboard
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                    >
                        Kembali
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PermissionDeniedPage;
