import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (other: boolean): Promise<ResponseMeta<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers', {
        params: { other },
      })
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.servers),
          data: data.servers.data || [],
        }),
      )
      .catch(reject);
  });
};
