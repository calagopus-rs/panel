import { axiosInstance } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<UserApiKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/api-keys', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.apiKeys))
      .catch(reject);
  });
};
