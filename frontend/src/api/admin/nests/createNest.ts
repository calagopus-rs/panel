import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  author: string;
  name: string;
  description: string | null;
}

export default async (data: Data): Promise<Nest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nests', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
