import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';
import { adminNodeSchema } from '@/lib/schemas/admin/nodes.ts';

export default async (data: z.infer<typeof adminNodeSchema>): Promise<Node> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nodes', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.node))
      .catch(reject);
  });
};
