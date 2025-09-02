import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nodeUuid: string, data: UpdateNode): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nodes/${nodeUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
