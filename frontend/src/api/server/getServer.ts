import { Server } from '@/api/types';
import { axiosInstance } from '@/api/axios';
import { rawDataToServerObject } from '@/api/transformers';

export default async (uuid: string): Promise<[Server, string[]]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}`)
      .then(({ data }) =>
        resolve([rawDataToServerObject(data), data.meta?.is_server_owner ? ['*'] : data.meta?.user_permissions || []]),
      )
      .catch(reject);
  });
};
