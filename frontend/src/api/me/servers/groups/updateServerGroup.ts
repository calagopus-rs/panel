import { axiosInstance } from '@/api/axios';

export default async (serverGroupUuid: string, data: { name?: string; serverOrder?: string[] }): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/groups/${serverGroupUuid}`, { name: data.name, server_order: data.serverOrder })
      .then(() => resolve())
      .catch(reject);
  });
};
