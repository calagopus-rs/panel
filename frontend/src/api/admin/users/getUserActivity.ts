import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (userUuid: string, page: number, search?: string): Promise<ResponseMeta<UserActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/users/${userUuid}/activity`, {
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
