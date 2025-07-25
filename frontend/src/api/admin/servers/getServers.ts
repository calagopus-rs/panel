import { axiosInstance } from '@/api/axios';

interface GetServersParams {
  page?: number;
  perPage?: number;
}

export default async (params: GetServersParams = {}): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/servers', { params })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};