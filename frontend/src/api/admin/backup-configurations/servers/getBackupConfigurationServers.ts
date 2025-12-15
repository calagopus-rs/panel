import { axiosInstance } from '@/api/axios.ts';

export default async (backupConfigUuid: string, page: number, search?: string): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/servers`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
