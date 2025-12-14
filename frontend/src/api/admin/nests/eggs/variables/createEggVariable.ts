import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';
import { z } from 'zod';

import { adminEggVariableSchema } from '@/lib/schemas/admin/eggs.ts';

export default async (
  nestUuid: string,
  eggUuid: string,
  data: z.infer<typeof adminEggVariableSchema>,
): Promise<NestEggVariable> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.variable))
      .catch(reject);
  });
};
