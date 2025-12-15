import { axiosInstance } from '@/api/axios.ts';

export interface BackupStats {
  total: number;
  successful: number;
  successfulBytes: number;
  failed: number;
  deleted: number;
  deletedBytes: number;
}

export default async (
  backupConfigUuid: string,
): Promise<Record<'allTime' | 'today' | 'week' | 'month', BackupStats>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/stats`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
