import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateLocation): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/locations', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
