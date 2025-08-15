import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
}

export default async (uuid: string, data: Data): Promise<any> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/databases`, {
        name: data.name,
      })
      .then(({ data }) => resolve(data.database))
      .catch(reject);
  });
};
