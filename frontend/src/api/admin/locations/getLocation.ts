import { axiosInstance } from '@/api/axios';

export default async (locationUuid: string): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/locations/${locationUuid}`)
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
