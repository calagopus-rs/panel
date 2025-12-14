import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerDatabase>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases`, {
        params: { page, search, include_password: true },
      })
      .then(({ data }) => resolve(data.databases))
      .catch(reject);
  });
};
