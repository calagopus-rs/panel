import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<UserSecurityKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/security-keys', {
        params: { page, search },
      })
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.securityKeys),
          data: data.securityKeys.data || [],
        }),
      )
      .catch(reject);
  });
};
