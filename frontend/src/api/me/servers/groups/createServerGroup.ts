import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  name: string;
  serverOrder: string[];
}

export default async (data: Data): Promise<UserServerGroup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/servers/groups', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.serverGroup))
      .catch(reject);
  });
};
