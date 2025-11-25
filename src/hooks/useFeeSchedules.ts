import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeSchedulesService } from '../services/api/feeSchedules.service';
import { FeeSchedule } from '../types/FeeSchedule';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all fee schedules
 */
export function useFeeSchedules() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['feeSchedules', firmId],
    queryFn: async () => {
      const response = await feeSchedulesService.getAll(firmId!);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000,
  });
}



