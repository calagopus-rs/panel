import { axiosInstance } from '@/api/axios';

interface GetNestsParams {
  page?: number;
  perPage?: number;
}

export default async (params: GetNestsParams = {}): Promise<ResponseMeta<Nest>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/nests', { params })
      .then(({ data }) => resolve(data.nests))
      .catch(reject);
  });
};