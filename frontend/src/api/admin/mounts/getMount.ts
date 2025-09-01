import { axiosInstance } from '@/api/axios';

export default async (mountUuid: string): Promise<Mount> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/mounts/${mountUuid}`)
      .then(({ data }) => resolve(data.mount))
      .catch(reject);
  });
};
