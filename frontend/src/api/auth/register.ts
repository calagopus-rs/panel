import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  username: string;
  email: string;
  nameFirst: string;
  nameLast: string;
  password: string;
  captcha?: string;
}

interface Response {
  user: User;
}

export default async (data: Data): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/register', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
