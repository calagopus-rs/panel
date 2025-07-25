import { axiosInstance } from '@/api/axios';

interface GetEggsParams {
  page?: number;
  perPage?: number;
}

export default async (nestId: number, params: GetEggsParams = {}): Promise<ResponseMeta<AdminNestEgg>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestId}/eggs`, { params })
      .then(({ data }) => resolve(data.eggs))
      .catch(reject);
  });
};