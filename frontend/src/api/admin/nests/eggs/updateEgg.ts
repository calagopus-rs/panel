import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminEggSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (nestUuid: string, eggUuid: string, data: z.infer<typeof adminEggSchema>): Promise<void> => {
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
