import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (uuid: string, page: number): Promise<ResponseMeta<ServerActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/activity?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.activities),
          data: data.activities.data || [],
        }),
      )
      .catch(reject);
  });
};
