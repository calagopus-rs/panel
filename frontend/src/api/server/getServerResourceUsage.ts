import { axiosInstance } from '@/api/axios';
import { transformKeysToCamelCase } from '../transformers';

export default async (uuid: string): Promise<ResourceUsage> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/resources`)
      .then(({ data }) => resolve(transformKeysToCamelCase(data)))
      .catch(reject);
  });
};
