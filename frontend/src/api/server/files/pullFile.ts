import { axiosInstance } from '@/api/axios';

interface Data {
  root: string;
  url: string;
  name: string;
}

export default async (uuid: string, data: Data): Promise<string> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/pull`, {
        root: data.root,
        url: data.url,
        name: data.name,
      })
      .then(({ data }) => resolve(data.identifier))
      .catch(reject);
  });
};
