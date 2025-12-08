import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { z } from 'zod';

import { adminEggVariableSchema } from '@/lib/schemas/admin/eggs';

export default async (
  nestUuid: string,
  eggUuid: string,
  variableUuid: string,
  data: z.infer<typeof adminEggVariableSchema>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables/${variableUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
