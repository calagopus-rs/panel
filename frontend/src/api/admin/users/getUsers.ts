import { axiosInstance } from '@/api/axios';

interface GetUsersParams {
  page?: number;
  perPage?: number;
}

export default async (params: GetUsersParams = {}): Promise<ResponseMeta<User>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/users', { params })
      .then(({ data }) => resolve(data.users))
      .catch(reject);
  });
};