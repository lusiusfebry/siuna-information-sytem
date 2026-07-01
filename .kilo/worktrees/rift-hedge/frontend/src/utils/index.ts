import { format } from 'date-fns';

export const formatDate = (date: string | Date | undefined, formatString = 'dd/MM/yyyy') => {
    if (!date) return '-';
    return format(new Date(date), formatString);
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
    }).format(amount);
};
