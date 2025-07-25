import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<UserApiKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/api-keys', {
        params: { page, search },
      })
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.apiKeys),
          data: data.apiKeys.data || [],
        }),
      )
      .catch(reject);
  });
};
