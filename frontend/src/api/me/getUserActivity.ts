import { axiosInstance, getPaginationSet } from '@/api/axios';
import { transformKeysToCamelCase } from '../transformers';

export default async (): Promise<PaginatedResult<UserActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/activity`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.activities),
          data: (data.activities.data || []).map((datum: any) => transformKeysToCamelCase(datum)),
        }),
      )
      .catch(reject);
  });
};
