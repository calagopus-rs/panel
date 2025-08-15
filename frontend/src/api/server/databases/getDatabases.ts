import { axiosInstance } from '@/api/axios';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerDatabase>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.databases))
      .catch(reject);
  });
};
