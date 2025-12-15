import { axiosInstance } from '@/api/axios.ts';

export default async (
  databaseHostUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AdminServerDatabase>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/database-hosts/${databaseHostUuid}/databases`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.databases))
      .catch(reject);
  });
};
