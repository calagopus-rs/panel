import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, page: number, search?: string): Promise<ResponseMeta<AdminNestEgg>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.eggs))
      .catch(reject);
  });
};
