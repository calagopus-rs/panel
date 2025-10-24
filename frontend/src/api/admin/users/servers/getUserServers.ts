import { axiosInstance } from '@/api/axios';

export default async (userUuid: string, page: number, search?: string): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/users/${userUuid}/servers`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
