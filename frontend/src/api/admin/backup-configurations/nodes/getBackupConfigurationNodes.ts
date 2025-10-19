import { axiosInstance } from '@/api/axios';

export default async (backupConfigUuid: string, page: number, search?: string): Promise<ResponseMeta<Node>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/nodes`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.nodes))
      .catch(reject);
  });
};
