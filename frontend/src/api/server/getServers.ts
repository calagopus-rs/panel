import { axiosInstance, getPaginationSet } from '@/api/axios.ts';

export default async (page: number, search?: string, other?: boolean): Promise<ResponseMeta<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers', {
        params: { page, per_page: 26, search, other },
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
