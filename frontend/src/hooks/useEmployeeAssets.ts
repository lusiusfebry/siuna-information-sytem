import { useQuery } from '@tanstack/react-query';
import inventoryEmployeeService from '../services/api/inventory-employee.service';

export const useEmployeeAssets = (employeeId: number) => {
    return useQuery({
        queryKey: ['employeeAssets', employeeId],
        queryFn: () => inventoryEmployeeService.getEmployeeAssets(employeeId),
        enabled: !!employeeId,
    });
};

export const useEmployeeAssetHistory = (employeeId: number) => {
    return useQuery({
        queryKey: ['employeeAssetHistory', employeeId],
        queryFn: () => inventoryEmployeeService.getAssetHistory(employeeId),
        enabled: !!employeeId,
    });
};
