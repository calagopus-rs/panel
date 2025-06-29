import { axiosInstance } from '@/api/axios';
import { rawDataToServerDatabase } from '@/api/transformers';
import { ServerDatabase } from '@/api/types';

export default async (
  uuid: string,
  data: { databaseName: string; connectionsFrom: string },
): Promise<ServerDatabase> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(
        `/api/client/servers/${uuid}/databases`,
        {
          database: data.databaseName,
          remote: data.connectionsFrom,
        },
        {
          params: { include: 'password' },
        },
      )
      .then(({ data }) => resolve(rawDataToServerDatabase(data.attributes)))
      .catch(reject);
  });
};
