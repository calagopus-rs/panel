import { axiosInstance } from '@/api/axios.ts';

export default async (hostUuid: string): Promise<AdminDatabaseHost> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/database-hosts/${hostUuid}`)
      .then(({ data }) => resolve(data.databaseHost))
      .catch(reject);
  });
};
