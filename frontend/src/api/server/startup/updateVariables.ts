import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

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
