import { axiosInstance } from '@/api/axios.ts';

export default async (backupConfigUuid: string, page: number, search?: string): Promise<ResponseMeta<Location>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/locations`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.locations))
      .catch(reject);
  });
};
