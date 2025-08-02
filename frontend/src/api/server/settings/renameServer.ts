import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  description: string;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/settings/rename`, {
        name: data.name,
        description: data.description,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
