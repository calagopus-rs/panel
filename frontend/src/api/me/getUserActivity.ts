import { axiosInstance, getPaginationSet } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<UserActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/activity', {
        params: { page, search },
      })
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.activities),
          data: data.activities.data || [],
        }),
      )
      .catch(reject);
  });
};
