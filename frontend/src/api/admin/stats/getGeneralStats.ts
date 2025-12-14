import { axiosInstance } from '@/api/axios.ts';

export interface GeneralStats {
  users: number;
  servers: number;
  locations: number;
  nodes: number;
}

export default async (): Promise<GeneralStats> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/stats/general')
      .then(({ data }) => resolve(data.stats))
      .catch(reject);
  });
};
