import { axiosInstance } from '@/api/axios.ts';

interface Data {
  notes?: string | null;
  primary?: boolean;
}

export default async (uuid: string, allocationUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/allocations/${allocationUuid}`, {
        notes: data.notes,
        primary: data.primary,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
