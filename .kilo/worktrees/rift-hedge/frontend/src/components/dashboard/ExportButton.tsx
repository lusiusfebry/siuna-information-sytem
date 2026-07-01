import { useState } from 'react';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const ExportButton = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async (type: 'excel' | 'pdf') => {
        setIsLoading(true);
        try {
            // Placeholder for API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`Berhasil mengexport data ke ${type === 'excel' ? 'Excel' : 'PDF'}`);
        } catch (error) {
            toast.error('Gagal mengexport data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleExport('excel')}
                disabled={isLoading}
            >
                <span className="material-symbols-outlined text-[20px]">table_view</span>
                Export Excel
            </Button>
            <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleExport('pdf')}
                disabled={isLoading}
            >
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                Export PDF
            </Button>
        </div>
    );
};

export default ExportButton;
