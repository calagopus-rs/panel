import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (uuid: string, variables: EnvVariable[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/variables`, {
        variables: transformKeysToSnakeCase(variables),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
