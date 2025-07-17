import { axiosInstance } from '@/api/axios';

export default async (location: number): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/locations/${location}`)
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
