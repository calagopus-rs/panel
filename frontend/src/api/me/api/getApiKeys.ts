import { axiosInstance, getPaginationSet } from '@/api/axios';
import { transformKeysToCamelCase } from '@/api/transformers';

export default async (page: number): Promise<ResponseMeta<UserApiKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/api-keys?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.api_keys),
          data: (data.api_keys.data || []).map((datum: any) => transformKeysToCamelCase(datum)),
        }),
      )
      .catch(reject);
  });
};
