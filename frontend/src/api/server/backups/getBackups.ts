import { axiosInstance } from '@/api/axios';

export default async (uuid: string, page: number): Promise<ResponseMeta<ServerBackup>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups`, {
        params: { page },
      })
      .then(({ data }) => resolve(data.backups))
      .catch(reject);
  });
};
