import { axiosInstance } from '@/api/axios';

interface Data {
  root: string;
  url: string;
  name: string;
}

export default async (uuid: string, data: Data): Promise<string> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/pull`, data)
      .then(({ data }) => resolve(data.identifier))
      .catch(reject);
  });
};
