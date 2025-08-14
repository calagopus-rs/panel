import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  author: string;
  name: string;
  description: string | null;
}

export default async (nest: number, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nest}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
