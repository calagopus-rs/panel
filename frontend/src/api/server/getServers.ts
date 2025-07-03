import { axiosInstance, getPaginationSet, PaginatedResult } from '@/api/axios';
import { rawDataToServerObject } from '@/api/transformers';

export default async (): Promise<PaginatedResult<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers')
      .then(({ data }) =>
        resolve({
          items: (data.data || []).map((datum: any) => rawDataToServerObject(datum)),
          pagination: getPaginationSet(data.meta.pagination),
        }),
      )
      .catch(reject);
  });
};
