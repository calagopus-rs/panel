import { axiosInstance, getPaginationSet } from '@/api/axios';
import { rawDataToServerObject } from '@/api/transformers';

export default async (): Promise<PaginatedResult<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers')
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.servers),
          data: (data.servers.data || []).map((datum: any) => rawDataToServerObject(datum)),
        }),
      )
      .catch(reject);
  });
};
