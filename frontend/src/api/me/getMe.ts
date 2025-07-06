import { axiosInstance } from '@/api/axios';
import { transformKeysToCamelCase } from '../transformers';

export default async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account`)
      .then(({ data }) => resolve(transformKeysToCamelCase(data.user)))
      .catch(reject);
  });
};
