import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string): Promise<AdminServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}`)
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
