import { axiosInstance } from '@/api/axios';

interface Response {
  apiKey: UserApiKey;
  key: string;
}

export default async (name: string): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/account/api-keys`, { name, permissions: [] })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
