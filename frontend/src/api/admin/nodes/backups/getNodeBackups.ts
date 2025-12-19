import { axiosInstance } from '@/api/axios.ts';

export default async (
  nodeUuid: string,
  page: number,
  search?: string,
  detached?: boolean,
): Promise<ResponseMeta<AdminServerBackup>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}/backups`, {
        params: { page, search, detached },
      })
      .then(({ data }) => resolve(data.backups))
      .catch(reject);
  });
};
