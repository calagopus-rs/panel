import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nestUuid: string, eggUuid: string, data: AdminUpdateNestEgg): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}`, {
        ...transformKeysToSnakeCase(data),
        docker_images: data.dockerImages,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
