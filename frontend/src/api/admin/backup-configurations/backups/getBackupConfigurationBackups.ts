import { axiosInstance } from '@/api/axios.ts';

export default async (
  backupConfigUuid: string,
  page: number,
  search?: string,
  detached?: boolean,
): Promise<ResponseMeta<AdminServerBackup>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/backups`, {
        params: { page, search, detached },
      })
      .then(({ data }) => resolve(data.backups))
      .catch(reject);
  });
};
