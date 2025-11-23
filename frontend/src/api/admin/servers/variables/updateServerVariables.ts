import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (serverUuid: string, variables: EnvVariable[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/servers/${serverUuid}/variables`, {
        variables: transformKeysToSnakeCase(variables),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
