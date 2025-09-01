import { axiosInstance } from '@/api/axios';

export default async (
  locationUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<LocationDatabaseHost>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/locations/${locationUuid}/database-hosts`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.databaseHosts))
      .catch(reject);
  });
};
