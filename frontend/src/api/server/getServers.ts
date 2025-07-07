import { axiosInstance, getPaginationSet } from '@/api/axios';
import { transformKeysToCamelCase } from '../transformers';

export default async (): Promise<ResponseMeta<ApiServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers')
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.servers),
          data: (data.servers.data || []).map((datum: any) => transformKeysToCamelCase(datum)),
        }),
      )
      .catch(reject);
  });
};
