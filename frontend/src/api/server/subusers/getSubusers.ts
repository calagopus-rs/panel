import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<ResponseMeta<ServerSubuser>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/subusers`)
      .then(({ data }) => resolve(data.subusers))
      .catch(reject);
  });
};
