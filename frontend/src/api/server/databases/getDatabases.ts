import { ServerDatabase } from '@/api/types';
import { axiosInstance } from '@/api/axios';
import { rawDataToServerDatabase } from '@/api/transformers';

export default async (uuid: string): Promise<ServerDatabase[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases`, {
        params: { include: 'password' },
      })
      .then(({ data }) => resolve((data.data || []).map((item: any) => rawDataToServerDatabase(item.attributes))))
      .catch(reject);
  });
};
