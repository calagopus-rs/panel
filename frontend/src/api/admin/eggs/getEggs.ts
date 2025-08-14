import { axiosInstance } from '@/api/axios';

export default async (nest: number, page: number, search?: string): Promise<ResponseMeta<AdminNestEgg>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nest}/eggs`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.eggs))
      .catch(reject);
  });
};
