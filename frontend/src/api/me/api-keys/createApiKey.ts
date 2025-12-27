import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Response {
  apiKey: UserApiKey;
  key: string;
}

export default async (data: UpdateUserApiKey): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/api-keys', {
        ...transformKeysToSnakeCase(data),
        expires: data.expires ? data.expires.toISOString() : null,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
