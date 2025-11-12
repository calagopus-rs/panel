import { axiosInstance } from '@/api/axios';

export default async (
  mountUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AndCreated<{ node: Node }>>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/mounts/${mountUuid}/nodes`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.nodeMounts))
      .catch(reject);
  });
};
