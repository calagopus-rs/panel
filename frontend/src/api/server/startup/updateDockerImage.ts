import { axiosInstance } from '@/api/axios';

interface Data {
  image: string;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/docker-image`, {
        image: data.image,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
