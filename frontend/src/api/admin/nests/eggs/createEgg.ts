import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nestUuid: string, data: AdminUpdateNestEgg): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs`, {
        ...transformKeysToSnakeCase(data),
        docker_images: data.dockerImages,
      })
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
