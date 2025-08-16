import { axiosInstance } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<User>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/users', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.users))
      .catch(reject);
  });
};
