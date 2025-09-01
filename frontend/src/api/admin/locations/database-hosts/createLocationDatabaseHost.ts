import { axiosInstance } from '@/api/axios';

export default async (locationUuid: string, hostUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/locations/${locationUuid}/database-hosts`, {
        database_host_uuid: hostUuid,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
