import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (location: number, data: UpdateLocation): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${location}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
