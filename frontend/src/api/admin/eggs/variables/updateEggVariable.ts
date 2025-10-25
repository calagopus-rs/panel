import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (
  nestUuid: string,
  eggUuid: string,
  variableUuid: string,
  data: UpdateNestEggVariable,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables/${variableUuid}`, {
        ...transformKeysToSnakeCase(data),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
