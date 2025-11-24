import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  databaseHostUuid: string;
  name: string;
}

export default async (uuid: string, data: Data): Promise<ServerDatabase> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/databases`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.database))
      .catch(reject);
  });
};
