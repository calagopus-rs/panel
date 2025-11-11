import { axiosInstance } from '@/api/axios';

export default async (): Promise<UserServerGroup[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/servers/groups')
      .then(({ data }) => resolve(data.serverGroups))
      .catch(reject);
  });
};
