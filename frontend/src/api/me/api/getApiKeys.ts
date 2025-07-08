import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number): Promise<ResponseMeta<UserApiKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/api-keys?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.apiKeys),
          data: data.apiKeys.data || [],
        }),
      )
      .catch(reject);
  });
};
