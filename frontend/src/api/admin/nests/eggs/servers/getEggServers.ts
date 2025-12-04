import { axiosInstance } from '@/api/axios';

export default async (
  nestUuid: string,
  eggUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/servers`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
