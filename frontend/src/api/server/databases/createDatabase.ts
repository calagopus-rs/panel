import { axiosInstance } from '@/api/axios';

interface Data {
  databaseName: string;
  connectionsFrom: string;
}

export default async (uuid: string, data: Data): Promise<any> => {
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
      .then(({ data }) => resolve(null))
      .catch(reject);
  });
};
