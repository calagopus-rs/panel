import { axiosInstance } from '@/api/axios';

export default async (name: string, serverOrder: string[]): Promise<UserServerGroup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/servers/groups', { name, server_order: serverOrder })
      .then(({ data }) => resolve(data.serverGroup))
      .catch(reject);
  });
};
