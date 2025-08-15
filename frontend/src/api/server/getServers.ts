import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (): Promise<ResponseMeta<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers')
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.servers),
          data: data.servers.data || [],
        }),
      )
      .catch(reject);
  });
};
