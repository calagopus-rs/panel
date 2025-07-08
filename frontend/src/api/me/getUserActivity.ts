import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number): Promise<ResponseMeta<UserActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/activity?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.activities),
          data: (data.activities.data || []).map((datum: any) => datum),
        }),
      )
      .catch(reject);
  });
};
