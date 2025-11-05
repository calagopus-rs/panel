import { axiosInstance } from '@/api/axios';

export interface BackupStats {
  total: number;
  successful: number;
  failed: number;
  deleted: number;
}

export default async (): Promise<Record<'today' | 'week' | 'month', BackupStats>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/stats/backups')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
