import { axiosInstance } from '@/api/axios';
import { rawDataToServerDatabase } from '@/api/transformers';

interface Data {
  databaseName: string;
  connectionsFrom: string;
}

export default async (uuid: string, data: Data): Promise<ServerDatabase> => {
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
