import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<ResponseMeta<any>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases`, {
        params: { include: 'password' },
      })
      .then(({ data }) => resolve(null))
      .catch(reject);
  });
};
