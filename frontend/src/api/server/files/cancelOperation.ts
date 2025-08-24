import { axiosInstance } from '@/api/axios';

export default async (uuid: string, operationUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/files/operations/${operationUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
