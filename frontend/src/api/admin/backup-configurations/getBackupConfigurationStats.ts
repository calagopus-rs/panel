import { axiosInstance } from '@/api/axios';

export interface BackupStats {
  total: number;
  successful: number;
  successfulBytes: number;
  failed: number;
  deleted: number;
  deletedBytes: number;
}

export default async (backupConfigUuid: string): Promise<Record<'today' | 'week' | 'month', BackupStats>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}/stats`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
