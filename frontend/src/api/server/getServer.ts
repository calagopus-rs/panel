import { axiosInstance } from '@/api/axios';
import { transformKeysToCamelCase } from '../transformers';

export default async (uuid: string): Promise<ApiServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}`)
      .then(({ data }) => resolve(transformKeysToCamelCase(data.server)))
      .catch(reject);
  });
};
