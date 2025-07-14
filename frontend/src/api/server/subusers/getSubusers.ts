import { axiosInstance } from '@/api/axios';

export default async (uuid: string, page: number): Promise<ResponseMeta<ServerSubuser>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/subusers`, {
        params: { page },
      })
      .then(({ data }) => resolve(data.subusers))
      .catch(reject);
  });
};
