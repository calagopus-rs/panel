import { axiosInstance } from '@/api/axios.ts';

export default async (
  mountUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AndCreated<{ server: AdminServer }>>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/mounts/${mountUuid}/servers`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.serverMounts))
      .catch(reject);
  });
};
