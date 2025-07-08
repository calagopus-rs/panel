import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (): Promise<ResponseMeta<ApiServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers')
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.servers),
          data: (data.servers.data || []).map((datum: any) => datum),
        }),
      )
      .catch(reject);
  });
};
