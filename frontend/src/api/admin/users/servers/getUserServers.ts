import { axiosInstance } from '@/api/axios';

export default async (
  userUuid: string,
  page: number,
  search?: string,
  owned?: boolean,
): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/users/${userUuid}/servers`, {
        params: { page, search, owned },
      })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
