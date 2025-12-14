import { axiosInstance } from '@/api/axios.ts';

export default async (serverGroupUuid: string, page: number, search?: string): Promise<ResponseMeta<Server>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/groups/${serverGroupUuid}`, { params: { page, search } })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
