import { axiosInstance } from '@/api/axios';

export default async (roleUuid: string, page: number, search?: string): Promise<ResponseMeta<User>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/roles/${roleUuid}/users`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.users))
      .catch(reject);
  });
};
