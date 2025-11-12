import { axiosInstance } from '@/api/axios';

export default async (
  mountUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AndCreated<{ nest: AdminNest; nestEgg: AdminNestEgg }>>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/mounts/${mountUuid}/nest-eggs`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.nestEggMounts))
      .catch(reject);
  });
};
