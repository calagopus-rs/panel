import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminEggSchema } from '@/lib/schemas/admin/eggs';

export default async (nestUuid: string, data: z.infer<typeof adminEggSchema>): Promise<AdminNestEgg> => {
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
