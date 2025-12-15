import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, image: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/docker-image`, {
        image,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
