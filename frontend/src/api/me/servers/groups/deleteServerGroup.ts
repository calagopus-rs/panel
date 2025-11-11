import { axiosInstance } from '@/api/axios';

export default async (serverGroupUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/groups/${serverGroupUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
