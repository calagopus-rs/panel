import { axiosInstance } from '@/api/axios';

interface Response {
  recovery_codes: string[];
}

export default async (code: string, password: string): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/account/two-factor`, { code, password })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
