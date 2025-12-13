import { axiosInstance } from '@/api/axios';

interface Data {
  notes?: string;
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
