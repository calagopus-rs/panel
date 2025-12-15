import { axiosInstance, getPaginationSet } from '@/api/axios.ts';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/activity`, {
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
