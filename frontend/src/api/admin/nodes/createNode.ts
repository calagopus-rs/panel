import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateNode): Promise<Node> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nodes', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.node))
      .catch(reject);
  });
};
