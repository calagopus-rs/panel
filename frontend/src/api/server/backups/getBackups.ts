import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerBackup>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.backups))
      .catch(reject);
  });
};
