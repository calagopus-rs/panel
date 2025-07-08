import { axiosInstance } from '@/api/axios';

export default async (uuid: string, directory: string, page: number): Promise<ResponseMeta<DirectoryEntry>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory: directory ?? '/', page, per_page: 100 },
      })
      .then(({ data }) => resolve(data.entries))
      .catch(reject);
  });
};
