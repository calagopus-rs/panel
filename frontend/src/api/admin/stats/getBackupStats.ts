import { axiosInstance } from '@/api/axios.ts';

export interface BackupStats {
  total: number;
  successful: number;
  successfulBytes: number;
  failed: number;
  deleted: number;
  deletedBytes: number;
}

export default async (): Promise<Record<'allTime' | 'today' | 'week' | 'month', BackupStats>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/stats/backups')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
